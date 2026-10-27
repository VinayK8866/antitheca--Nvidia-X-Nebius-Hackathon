import time
import json
import logging
from typing import Dict, Any, List, Optional

import numpy as np

from app.database import get_self_db_connection
from app.embeddings import generate_embedding, blob_to_float_list, float_list_to_blob, cosine_similarity
from app.tiered_memory import tiered_memory
from app.llm_client import llm_client
from app.activator import activator
from app.tavily_client import tavily_client

logger = logging.getLogger(__name__)

class EpistemicRouter:
    """Routes user queries through epistemic retrieval, knowledge arbitrage, and Nemotron synthesis."""

    def process_query(self, query: str, session_id: str = "default_session") -> Dict[str, Any]:
        """Main RAG + Arbitrage query pipeline."""
        start_time = time.time()

        # 1. Classify Intent
        classification = llm_client.classify_intent(query)
        intent = classification.get("intent", "recall")
        needs_research = classification.get("needs_external_research", False)

        # 2. Retrieve Relevant First-Party Chunks (Vector Search)
        query_vec = generate_embedding(query)
        relevant_chunks = self._vector_search_chunks(query_vec, top_k=4)

        # 3. Retrieve Personal Precedents & Wisdom
        memories_text = tiered_memory.format_memories_for_prompt(limit=8)
        decisions_text = self._retrieve_decisions_context(query)

        # 4. Proactive Knowledge Arbitrage
        arbitrage_opportunities = activator.find_arbitrage_opportunities(query, top_k=3)

        # 5. External Web Research if triggered
        external_context = ""
        if needs_research:
            web_results = tavily_client.search(query, max_results=2)
            if web_results:
                external_context = "### External Real-Time Web Evidence (Tavily Verified):\n" + "\n".join([
                    f"- [{r.get('title')}]({r.get('url')}): {r.get('content')[:200]}" for r in web_results
                ])

        # 6. Assemble Grounded Prompt
        chunks_context = "\n".join([f"- From [{c['title']}]: {c['content']}" for c in relevant_chunks])
        arbitrage_context = "\n".join([f"- Dormant Connection: [{a['title']}] ({a['reason']}): {a['excerpt'][:180]}" for a in arbitrage_opportunities])

        system_prompt = (
            "You are AntiTheca, an elite, highly intelligent personal cognitive partner. "
            "You speak directly with intellectual rigor, warmth, and zero fluff. "
            "Never use robotic AI clichés like 'Certainly' or 'I hope this helps'. "
            "Stress-test ideas when appropriate, cite the user's past precedents and memories, "
            "and connect dots across their knowledge base."
        )

        user_prompt = f"""
USER QUERY: {query}

### RETRIEVED PERSONAL CONTEXT:
{chunks_context or "No direct document notes found."}

{decisions_text}

{memories_text}

{f"### PROACTIVE ARBITRAGE OPPORTUNITIES (Forgotten/Cross-domain insights):" if arbitrage_context else ""}
{arbitrage_context}

{external_context}

Provide a sharp, direct, comprehensive answer. If there is a tension between the user's query and their established wisdom/decisions, explicitly challenge it.
"""

        # 7. Query NVIDIA Nemotron via Nebius Token Factory
        model_type = "reasoning" if intent in ["challenge", "decision"] else "fast"
        response_text = llm_client.query(
            user_prompt,
            system_prompt=system_prompt,
            model_type=model_type,
            temperature=0.25,
            max_tokens=1400
        )

        latency_ms = round((time.time() - start_time) * 1000, 2)

        # 8. Log telemetry
        self._log_interaction(session_id, query, response_text, intent, model_type, latency_ms)

        return {
            "query": query,
            "response": response_text,
            "intent": intent,
            "model_type": model_type,
            "model_used": llm_client.reasoning_model if model_type == "reasoning" else llm_client.fast_model,
            "latency_ms": latency_ms,
            "sources": [{"title": c["title"], "doc_id": c["doc_id"]} for c in relevant_chunks],
            "arbitrage_nuggets": arbitrage_opportunities,
            "needs_research": needs_research
        }

    def _vector_search_chunks(self, query_vec: List[float], top_k: int = 4, threshold: float = 0.35) -> List[Dict[str, Any]]:
        conn = get_self_db_connection()
        cur = conn.cursor()

        # 1. High-Performance Indexed Vector Search via sqlite-vec (vec0)
        try:
            query_blob = float_list_to_blob(query_vec)
            cur.execute("""
            SELECT c.id, c.doc_id, c.content, d.title, d.modality, v.distance
            FROM vec_chunks v
            JOIN chunks c ON c.id = v.chunk_id
            JOIN documents d ON d.id = c.doc_id
            WHERE v.embedding MATCH ? AND k = ?
            ORDER BY v.distance
            """, (query_blob, top_k * 3))
            rows = cur.fetchall()
            conn.close()

            scored = []
            for r in rows:
                sim = 1.0 - float(r["distance"])
                if sim >= threshold:
                    scored.append({
                        "doc_id": r["doc_id"],
                        "title": r["title"],
                        "content": r["content"],
                        "modality": r["modality"],
                        "similarity": round(sim, 4)
                    })
            if scored:
                return scored[:top_k]
        except Exception as e_idx:
            logger.debug(f"sqlite-vec indexed query fallback ({e_idx})")

        # 2. Vectorized batch fallback: NumPy matrix dot-product instead of sequential unindexed loops
        try:
            conn = get_self_db_connection()
            cur = conn.cursor()
            cur.execute("""
            SELECT c.id, c.doc_id, c.content, c.embedding_blob, d.title, d.modality
            FROM chunks c
            JOIN documents d ON d.id = c.doc_id
            WHERE c.embedding_blob IS NOT NULL
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
                        "doc_id": r["doc_id"],
                        "title": r["title"],
                        "content": r["content"],
                        "modality": r["modality"],
                        "similarity": round(float(sim), 4)
                    })

            scored.sort(key=lambda x: x["similarity"], reverse=True)
            return scored[:top_k]
        except Exception as e_fb:
            logger.error(f"Vector search fallback error: {e_fb}")
            return []

    def _retrieve_decisions_context(self, query: str) -> str:
        conn = get_self_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT id, title, decision_text, status FROM decisions WHERE status = 'active' LIMIT 5")
        rows = cur.fetchall()
        conn.close()

        if not rows:
            return ""
        lines = ["### Established Prior Decisions & Precedents:"]
        for r in rows:
            lines.append(f"- Decision #{r['id']} [{r['title']}]: {r['decision_text']}")
        return "\n".join(lines)

    def _log_interaction(self, session_id: str, query: str, response: str, intent: str, model_type: str, latency: float):
        try:
            conn = get_self_db_connection()
            cur = conn.cursor()
            cur.execute("""
            INSERT INTO interactions (session_id, query, response, intent, model_used, latency_ms)
            VALUES (?, ?, ?, ?, ?, ?)
            """, (session_id, query, response, intent, model_type, latency))
            conn.commit()
            conn.close()
        except Exception as e:
            logger.warning(f"Failed to log interaction: {e}")

router = EpistemicRouter()
