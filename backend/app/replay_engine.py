import json
import logging
from datetime import datetime, date
from typing import Dict, Any, List, Optional

from app.database import get_self_db_connection
from app.llm_client import llm_client
from app.graph_engine import graph_engine
from app.tavily_client import tavily_client

logger = logging.getLogger(__name__)

class CognitiveReplayEngine:
    """Autonomous overnight cognitive processing inspired by human memory consolidation during sleep."""

    def run_replay_cycle(self, force_all: bool = False) -> Dict[str, Any]:
        """Executes full autonomous replay: Ingest scan -> Graph weaving -> Gap research -> Synthesis."""
        conn = get_self_db_connection()
        cur = conn.cursor()

        # 1. Fetch un-replayed knowledge atoms
        if force_all:
            cur.execute("SELECT id, title, content, modality, created_at FROM documents ORDER BY id DESC LIMIT 20")
        else:
            cur.execute("SELECT id, title, content, modality, created_at FROM documents WHERE is_processed_replay = 0 ORDER BY id ASC")
        pending_docs = cur.fetchall()

        if not pending_docs:
            logger.info("Cognitive Replay: No pending documents to process.")
            conn.close()
            return {
                "status": "idle",
                "message": "All knowledge atoms are consolidated. No pending replay required.",
                "replayed_atoms": 0,
                "briefing": None
            }

        doc_summaries = []
        doc_ids = []
        for d in pending_docs:
            doc_ids.append(d["id"])
            doc_summaries.append(f"- **{d['title']}** ({d['modality']}): {d['content'][:250]}...")

        # 2. Weave graph connections & discover bridge concepts
        for d in pending_docs:
            graph_engine.sync_document_to_graph(d["id"], d["title"], d["content"], d["modality"])

        graph_stats = graph_engine.detect_graph_anomalies_and_bridges()

        # 3. Identify Gaps & Trigger Autonomous Web Research (Tavily)
        research_gaps = []
        for d in pending_docs[:3]:
            # Use fast model to extract an open question or verify a claim
            claim_prompt = (
                f"Extract 1 critical factual claim or unanswered technical question from this text that warrants external verification: \n\n"
                f"{d['content'][:400]}"
            )
            raw_claim = llm_client.query(claim_prompt, system_prompt="Be concise. 1 line query.", model_type="fast", max_tokens=60)
            clean_query = raw_claim.strip().strip('"').strip("'")
            if len(clean_query) > 10 and not clean_query.startswith("###"):
                tavily_res = tavily_client.verify_fact_or_gap(clean_query)
                research_gaps.append(tavily_res)

        # 4. Generate the Cognitive Replay Briefing via NVIDIA Nemotron Reasoning Model
        synthesis_prompt = f"""
You are Engram's Cognitive Replay Engine. While the user was away/sleeping, you analyzed their recent knowledge entries.

### RECENT KNOWLEDGE ATOMS PROCESSED ({len(doc_ids)} items):
{chr(10).join(doc_summaries)}

### GRAPH TOPOLOGY:
- Total Concepts: {graph_stats.get('total_nodes', 0)}
- Total Connections: {graph_stats.get('total_edges', 0)}
- Bridge Concepts: {[b['name'] for b in graph_stats.get('bridge_concepts', [])]}

### EXTERNAL VERIFIED INSIGHTS (Via Tavily):
{json.dumps([{"topic": g["topic"], "evidence": [e["title"] for e in g["evidence"]]} for g in research_gaps], indent=2)}

Generate a crisp, high-impact Daily Cognitive Briefing in markdown with these exact sections:
1. **Executive Synthesis**: What is the non-obvious common thread or pattern connecting these entries?
2. **Key Bridges & Connections Discovered**: How do these new notes connect to existing decisions or concepts?
3. **External Real-World Verification**: What did external research (Tavily) confirm or reveal?
4. **Adversarial Stress Test**: Point out 1 potential blind spot, contradictory assumption, or overconfident leap in these notes.
5. **Recommended Next Action**: 1 concrete step to execute today.
"""

        system_prompt = (
            "You are Engram, an elite adversarial second brain. Write with sharp clarity, intellectual honesty, "
            "and directness. No generic fluff. Speak as an intelligent thinking partner."
        )

        briefing_markdown = llm_client.query(
            synthesis_prompt,
            system_prompt=system_prompt,
            model_type="reasoning",
            temperature=0.3,
            max_tokens=1800
        )

        # Extract headline
        first_line = briefing_markdown.strip().split("\n")[0].replace("#", "").strip()
        headline = first_line if len(first_line) > 5 else f"Cognitive Replay: {len(doc_ids)} Atoms Consolidated"

        # 5. Persist the Briefing
        today_str = date.today().isoformat()
        cur.execute("""
        INSERT INTO replay_briefings (briefing_date, headline, summary_markdown, new_connections_count, contradictions_found_count, gaps_researched_count, payload_json)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(briefing_date) DO UPDATE SET
            headline = excluded.headline,
            summary_markdown = excluded.summary_markdown,
            new_connections_count = excluded.new_connections_count,
            contradictions_found_count = excluded.contradictions_found_count,
            gaps_researched_count = excluded.gaps_researched_count,
            payload_json = excluded.payload_json
        """, (
            today_str,
            headline,
            briefing_markdown,
            graph_stats.get("total_edges", 0),
            1 if "Adversarial Stress Test" in briefing_markdown else 0,
            len(research_gaps),
            json.dumps({"processed_doc_ids": doc_ids, "research_gaps": research_gaps})
        ))

        # 6. Mark documents as replayed
        cur.execute(f"UPDATE documents SET is_processed_replay = 1 WHERE id IN ({','.join(str(i) for i in doc_ids)})")
        conn.commit()
        conn.close()

        logger.info(f"Cognitive Replay finished successfully for {len(doc_ids)} atoms.")
        return {
            "status": "completed",
            "date": today_str,
            "headline": headline,
            "replayed_atoms": len(doc_ids),
            "briefing_markdown": briefing_markdown,
            "research_gaps": research_gaps
        }

    def get_latest_briefing(self) -> Optional[Dict[str, Any]]:
        """Fetches the most recent daily cognitive replay briefing."""
        conn = get_self_db_connection()
        cur = conn.cursor()
        cur.execute("""
        SELECT briefing_date, headline, summary_markdown, new_connections_count, 
               contradictions_found_count, gaps_researched_count, payload_json, created_at
        FROM replay_briefings ORDER BY briefing_date DESC LIMIT 1
        """)
        row = cur.fetchone()
        conn.close()
        if not row:
            return None

        return {
            "briefing_date": row["briefing_date"],
            "headline": row["headline"],
            "summary_markdown": row["summary_markdown"],
            "new_connections": row["new_connections_count"],
            "contradictions": row["contradictions_found_count"],
            "gaps_researched": row["gaps_researched_count"],
            "created_at": row["created_at"],
            "payload": json.loads(row["payload_json"] or "{}")
        }

replay_engine = CognitiveReplayEngine()
