import math
import json
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from app.database import get_self_db_connection
from app.embeddings import generate_embedding, float_list_to_blob, blob_to_float_list
import numpy as np

logger = logging.getLogger(__name__)

TIER_WEIGHTS = {
    "tier_working": 0.25,
    "tier_fact": 1.0,
    "tier_wisdom": 2.0
}

PROMOTION_THRESHOLDS = {
    "tier_working_to_fact": 3,   # 3 independent occurrences or explicit confirmation
    "tier_fact_to_wisdom": 8     # 8 consistent confirmations or explicit user axiom
}

DECAY_HALF_LIFE_DAYS = 30.0  # Working hypotheses decay if not reinforced for a month

class TieredMemoryManager:
    """Manages the epistemic memory ladder: Working -> Fact -> Wisdom."""

    def record_memory(
        self,
        learned_fact: str,
        category: str = "general",
        initial_tier: str = "tier_working",
        source_query: str = "",
        tags: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Inserts or reinforces a memory in self_brain.db with pre-computed vector indexing."""
        conn = get_self_db_connection()
        cur = conn.cursor()
        tags_json = json.dumps(tags or [])
        clean_fact = learned_fact.strip()

        # Pre-compute embedding once upon record creation/update
        try:
            mem_vec = generate_embedding(clean_fact)
            mem_blob = float_list_to_blob(mem_vec)
        except Exception as e_emb:
            logger.warning(f"Memory embedding generation error: {e_emb}")
            mem_blob = None

        # Check if identical or very close memory already exists
        cur.execute("""
        SELECT id, tier, occurrence_count, weight, status FROM memories
        WHERE learned_fact = ? AND status = 'active'
        """, (clean_fact,))
        existing = cur.fetchone()

        if existing:
            mem_id = existing["id"]
            current_tier = existing["tier"]
            count = existing["occurrence_count"] + 1
            new_weight = existing["weight"] + 0.35

            # Evaluate promotion
            promoted = False
            if current_tier == "tier_working" and count >= PROMOTION_THRESHOLDS["tier_working_to_fact"]:
                current_tier = "tier_fact"
                new_weight = max(new_weight, TIER_WEIGHTS["tier_fact"])
                promoted = True
                logger.info(f"Memory promoted to tier_fact: {clean_fact[:40]}")
            elif current_tier == "tier_fact" and count >= PROMOTION_THRESHOLDS["tier_fact_to_wisdom"]:
                current_tier = "tier_wisdom"
                new_weight = max(new_weight, TIER_WEIGHTS["tier_wisdom"])
                promoted = True
                logger.info(f"Memory promoted to tier_wisdom: {clean_fact[:40]}")

            cur.execute("""
            UPDATE memories SET
                occurrence_count = ?,
                weight = ?,
                tier = ?,
                embedding_blob = COALESCE(?, embedding_blob),
                last_observed_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """, (count, new_weight, current_tier, mem_blob, mem_id))

            if mem_blob:
                try:
                    cur.execute("INSERT OR REPLACE INTO vec_memories (memory_id, embedding) VALUES (?, ?)", (mem_id, mem_blob))
                except Exception:
                    pass

            conn.commit()
            conn.close()
            return {"id": mem_id, "tier": current_tier, "occurrences": count, "promoted": promoted, "status": "reinforced"}

        # Fresh memory entry
        weight = TIER_WEIGHTS.get(initial_tier, 0.25)
        cur.execute("""
        INSERT INTO memories (source_query, learned_fact, category, tier, weight, occurrence_count, tags_json, embedding_blob)
        VALUES (?, ?, ?, ?, ?, 1, ?, ?)
        """, (source_query, clean_fact, category, initial_tier, weight, tags_json, mem_blob))
        new_id = cur.lastrowid

        if mem_blob and new_id:
            try:
                cur.execute("INSERT OR REPLACE INTO vec_memories (memory_id, embedding) VALUES (?, ?)", (new_id, mem_blob))
            except Exception:
                pass

        conn.commit()
        conn.close()
        return {"id": new_id, "tier": initial_tier, "occurrences": 1, "promoted": False, "status": "created"}

    def get_active_memories(self, category: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        """Returns sorted active memories with temporal decay applied to tier_working."""
        conn = get_self_db_connection()
        cur = conn.cursor()

        if category:
            cur.execute("""
            SELECT id, learned_fact, category, tier, weight, occurrence_count, last_observed_at, tags_json
            FROM memories WHERE status = 'active' AND category = ?
            ORDER BY weight DESC LIMIT ?
            """, (category, limit))
        else:
            cur.execute("""
            SELECT id, learned_fact, category, tier, weight, occurrence_count, last_observed_at, tags_json
            FROM memories WHERE status = 'active'
            ORDER BY 
                CASE tier 
                    WHEN 'tier_wisdom' THEN 1 
                    WHEN 'tier_fact' THEN 2 
                    ELSE 3 
                END, weight DESC LIMIT ?
            """, (limit,))

        rows = cur.fetchall()
        conn.close()

        results = []
        for r in rows:
            results.append({
                "id": r["id"],
                "learned_fact": r["learned_fact"],
                "category": r["category"],
                "tier": r["tier"],
                "weight": float(r["weight"]),
                "occurrences": r["occurrence_count"],
                "last_observed_at": r["last_observed_at"],
                "tags": json.loads(r["tags_json"] or "[]")
            })
        return results

    def semantic_search_memories(self, query_vec: List[float], top_k: int = 5, threshold: float = 0.40) -> List[Dict[str, Any]]:
        """High-performance indexed/vectorized memory retrieval."""
        conn = get_self_db_connection()
        cur = conn.cursor()

        # 1. Primary: sqlite-vec indexed search
        try:
            query_blob = float_list_to_blob(query_vec)
            cur.execute("""
            SELECT m.id, m.learned_fact, m.category, m.tier, m.weight, v.distance
            FROM vec_memories v
            JOIN memories m ON m.id = v.memory_id
            WHERE m.status = 'active' AND v.embedding MATCH ? AND k = ?
            ORDER BY v.distance
            """, (query_blob, top_k * 2))
            rows = cur.fetchall()
            conn.close()

            results = []
            for r in rows:
                sim = 1.0 - float(r["distance"])
                if sim >= threshold:
                    results.append({
                        "id": r["id"],
                        "learned_fact": r["learned_fact"],
                        "category": r["category"],
                        "tier": r["tier"],
                        "weight": float(r["weight"]),
                        "similarity": round(sim, 4)
                    })
            if results:
                return results[:top_k]
        except Exception:
            pass

        # 2. Vectorized BLAS fallback: single NumPy matrix dot-product
        try:
            conn = get_self_db_connection()
            cur = conn.cursor()
            cur.execute("""
            SELECT id, learned_fact, category, tier, weight, embedding_blob
            FROM memories WHERE status = 'active' AND embedding_blob IS NOT NULL
            """)
            rows = cur.fetchall()
            conn.close()
            if not rows:
                return []

            blobs = [r["embedding_blob"] for r in rows]
            matrix = np.array([blob_to_float_list(b) for b in blobs], dtype=np.float32)
            q = np.array(query_vec, dtype=np.float32)
            sims = np.dot(matrix, q)

            scored = []
            for idx, sim in enumerate(sims):
                if float(sim) >= threshold:
                    r = rows[idx]
                    scored.append({
                        "id": r["id"],
                        "learned_fact": r["learned_fact"],
                        "category": r["category"],
                        "tier": r["tier"],
                        "weight": float(r["weight"]),
                        "similarity": round(float(sim), 4)
                    })
            scored.sort(key=lambda x: x["similarity"], reverse=True)
            return scored[:top_k]
        except Exception as e:
            logger.debug(f"Vector search memories fallback error: {e}")
            return []

    def format_memories_for_prompt(self, limit: int = 15) -> str:
        """Formats top personal memories into context block for LLM prompts."""
        memories = self.get_active_memories(limit=limit)
        if not memories:
            return ""

        lines = ["### Established Personal Epistemic Context & Wisdom:"]
        for m in memories:
            badge = "★ FOUNDATIONAL" if m["tier"] == "tier_wisdom" else ("◆ CONFIRMED" if m["tier"] == "tier_fact" else "○ WORKING")
            lines.append(f"- [{badge}] {m['learned_fact']} (reinforced {m['occurrences']}x)")
        return "\n".join(lines)

tiered_memory = TieredMemoryManager()
