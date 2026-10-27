import json
import logging
from typing import Dict, Any, List
from app.database import get_self_db_connection
from app.embeddings import generate_embedding, blob_to_float_list, float_list_to_blob, cosine_similarity

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

        # 1. High-Performance Indexed Vector Search for candidate chunks
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
            for r in rows:
                blob = r["embedding_blob"]
                chunk_vec = blob_to_float_list(blob)
                sim = cosine_similarity(query_vec, chunk_vec)
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

        # 2. Score active memories
        cur.execute("""
        SELECT id, learned_fact, tier, weight, category FROM memories WHERE status = 'active'
        """)
        memories = cur.fetchall()
        conn.close()

        for m in memories:
            mem_vec = generate_embedding(m["learned_fact"])
            sim = cosine_similarity(query_vec, mem_vec)
            if sim > 0.45:
                tier_mult = 1.3 if m["tier"] == "tier_wisdom" else (1.1 if m["tier"] == "tier_fact" else 1.0)
                arbitrage_score = sim * tier_mult
                scored_items.append({
                    "type": "memory",
                    "memory_id": m["id"],
                    "title": f"Memory: {m['category']}",
                    "modality": "wisdom" if m["tier"] == "tier_wisdom" else "fact",
                    "excerpt": m["learned_fact"],
                    "tags": [m["tier"], m["category"]],
                    "similarity": round(sim, 3),
                    "arbitrage_score": round(arbitrage_score, 3),
                    "reason": f"Established precedent ({m['tier']}) applicable to this dilemma."
                })

        scored_items.sort(key=lambda x: x["arbitrage_score"], reverse=True)
        return scored_items[:top_k]

activator = KnowledgeArbitrageActivator()
