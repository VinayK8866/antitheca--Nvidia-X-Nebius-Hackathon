import json
import logging
from typing import Dict, Any, List
import numpy as np
from app.database import get_self_db_connection
from app.embeddings import generate_embedding, blob_to_float_list, float_list_to_blob, cosine_similarity
from app.tiered_memory import tiered_memory

logger = logging.getLogger(__name__)

class KnowledgeArbitrageActivator:
    """Proactively surfaces dormant knowledge, saved reels, and cross-domain connections."""

    def find_arbitrage_opportunities(self, context_text: str, top_k: int = 4) -> List[Dict[str, Any]]:
        """Scans the entire brain for high-value connections relevant to the user's active context."""
        if not context_text or len(context_text.strip()) < 5:
            return []

        query_vec = generate_embedding(context_text)

        conn = get_self_db_connection()
        cur = conn.cursor()
        scored_items = []

        # 1. High-Performance Indexed Vector Search for candidate chunks (sqlite-vec)
        try:
            q_blob = float_list_to_blob(query_vec)
            cur.execute("""
            SELECT c.id as chunk_id, c.doc_id, c.content,
                   d.title, d.modality, d.created_at, d.tags_json, v.distance
            FROM vec_chunks v
            JOIN chunks c ON c.id = v.chunk_id
            JOIN documents d ON d.id = c.doc_id
            WHERE v.embedding MATCH ? AND k = ?
            ORDER BY v.distance
            """, (q_blob, top_k * 4))
            rows = cur.fetchall()
            for r in rows:
                sim = 1.0 - float(r["distance"])
                if sim > 0.40:
                    modality_boost = 1.2 if r["modality"] in ["reel", "decision"] else 1.0
                    arbitrage_score = sim * modality_boost
                    scored_items.append({
                        "type": "document",
                        "doc_id": r["doc_id"],
                        "title": r["title"],
                        "modality": r["modality"],
                        "excerpt": r["content"][:300],
                        "tags": json.loads(r["tags_json"] or "[]"),
                        "similarity": round(sim, 3),
                        "arbitrage_score": round(arbitrage_score, 3),
                        "created_at": r["created_at"],
                        "reason": f"High relevance ({int(sim*100)}%) to your current active context."
                    })
        except Exception as e_idx:
            logger.debug(f"sqlite-vec indexed query fallback in activator: {e_idx}")
            cur.execute("""
            SELECT c.id as chunk_id, c.doc_id, c.content, c.embedding_blob,
                   d.title, d.modality, d.created_at, d.tags_json
            FROM chunks c
            JOIN documents d ON d.id = c.doc_id
            WHERE c.embedding_blob IS NOT NULL
            """)
            rows = cur.fetchall()
            if rows:
                blobs = [r["embedding_blob"] for r in rows]
                matrix = np.array([blob_to_float_list(b) for b in blobs], dtype=np.float32)
                q = np.array(query_vec, dtype=np.float32)
                sims = np.dot(matrix, q)
                for idx, sim in enumerate(sims):
                    if float(sim) > 0.40:
                        r = rows[idx]
                        modality_boost = 1.2 if r["modality"] in ["reel", "decision"] else 1.0
                        arbitrage_score = float(sim) * modality_boost
                        scored_items.append({
                            "type": "document",
                            "doc_id": r["doc_id"],
                            "title": r["title"],
                            "modality": r["modality"],
                            "excerpt": r["content"][:300],
                            "tags": json.loads(r["tags_json"] or "[]"),
                            "similarity": round(float(sim), 3),
                            "arbitrage_score": round(arbitrage_score, 3),
                            "created_at": r["created_at"],
                            "reason": f"High relevance ({int(float(sim)*100)}%) to your current active context."
                        })

        conn.close()

        # 2. Score active memories via pre-indexed/vectorized memory search (sub-millisecond)
        try:
            matching_memories = tiered_memory.semantic_search_memories(query_vec, top_k=5, threshold=0.45)
            for m in matching_memories:
                tier_mult = 1.3 if m["tier"] == "tier_wisdom" else (1.1 if m["tier"] == "tier_fact" else 1.0)
                arbitrage_score = m["similarity"] * tier_mult
                scored_items.append({
                    "type": "memory",
                    "memory_id": m["id"],
                    "title": f"Memory: {m['category']}",
                    "modality": "wisdom" if m["tier"] == "tier_wisdom" else "fact",
                    "excerpt": m["learned_fact"],
                    "tags": [m["tier"], m["category"]],
                    "similarity": round(m["similarity"], 3),
                    "arbitrage_score": round(arbitrage_score, 3),
                    "reason": f"Established precedent ({m['tier']}) applicable to this dilemma."
                })
        except Exception as e_mem:
            logger.debug(f"Memory arbitrage scoring warning: {e_mem}")

        scored_items.sort(key=lambda x: x["arbitrage_score"], reverse=True)
        return scored_items[:top_k]

activator = KnowledgeArbitrageActivator()
