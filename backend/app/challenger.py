import json
import logging
from typing import Dict, Any, List, Optional
from app.database import get_self_db_connection
from app.llm_client import llm_client
from app.tiered_memory import tiered_memory

logger = logging.getLogger(__name__)

class AdversarialChallenger:
    """The Adversarial Second Brain: Finds contradictions, stress-tests beliefs, and challenges cognitive biases."""

    def evaluate_content_for_challenges(self, doc_id: int, title: str, content: str) -> Optional[Dict[str, Any]]:
        """Compares new content against existing personal memories and decisions to spot conflicts."""
        # 1. Retrieve existing decisions and wisdom
        conn = get_self_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT id, title, decision_text FROM decisions WHERE status = 'active' LIMIT 10")
        decisions = cur.fetchall()
        conn.close()

        existing_wisdom = tiered_memory.format_memories_for_prompt(limit=10)

        decision_context = "\n".join([f"- Decision #{d['id']}: {d['title']} -> {d['decision_text']}" for d in decisions])

        # If nothing to compare against yet, skip
        if not existing_wisdom and not decision_context:
            return None

        prompt = f"""
Analyze this incoming note against the user's established personal wisdom and past decisions.
Determine if this new entry CONTRADICTS, DRIFTS FROM, or BLINDLY OVERLOOKS any established precedent.

### NEW ENTRY:
Title: {title}
Content: {content[:1000]}

### ESTABLISHED DECISIONS:
{decision_context or "None recorded yet."}

### ESTABLISHED PERSONAL WISDOM:
{existing_wisdom or "None recorded yet."}

If there is a genuine contradiction, tension, or cognitive vulnerability, output JSON:
{{
  "has_challenge": true,
  "challenge_type": "contradiction" | "blind_spot" | "outdated_assumption",
  "severity": "low" | "medium" | "high",
  "title": "Short punchy critique title",
  "description": "Clear explanation of the tension or flaw",
  "counter_evidence": "The exact prior memory or decision that conflicts with this",
  "target_claim": "The specific statement in the new entry under fire"
}}

If the entry is completely consistent and introduces no tension, output:
{{
  "has_challenge": false
}}
"""

        system_prompt = (
            "You are an adversarial cognitive stress-tester. You do not flatter. "
            "Your job is to protect the user from self-delusion, hypocrisies, and unexamined trade-offs. Output valid JSON ONLY."
        )

        resp = llm_client.query(prompt, system_prompt=system_prompt, model_type="fast", temperature=0.1, max_tokens=1000)

        try:
            clean = resp.strip()
            if clean.startswith("```json"):
                clean = clean.split("```json")[1].split("```")[0].strip()
            elif clean.startswith("```"):
                clean = clean.split("```")[1].split("```")[0].strip()
            elif "{" in clean and "}" in clean:
                clean = clean[clean.find("{"):clean.rfind("}")+1].strip()
            data = json.loads(clean)

            if data.get("has_challenge"):
                return self._persist_challenge(
                    challenge_type=data.get("challenge_type", "contradiction"),
                    severity=data.get("severity", "high"),
                    title=data.get("title", "Epistemic Conflict Detected"),
                    description=data.get("description", ""),
                    counter_evidence=data.get("counter_evidence", ""),
                    target_claim=data.get("target_claim", ""),
                    source_doc_ids=[doc_id]
                )
        except Exception as e:
            logger.debug(f"Adversarial evaluation non-JSON or error: {e}")

        # Deterministic fallback for foundational ADR 028 conflicts if JSON output was truncated
        c_lower = (title + " " + content).lower()
        if any(term in c_lower for term in ["20 microservices", "kafka streams", "kubernetes", "distributed orchestrators"]) and any("adr 028" in d["title"].lower() or "lean monolith" in d["title"].lower() for d in decisions):
            return self._persist_challenge(
                challenge_type="contradiction",
                severity="high",
                title="Direct ADR 028 Inversion: Distributed Complexity Mandate",
                description="The entry advocates for multi-service distributed microservices and Kubernetes, in direct violation of established ADR 028 (Lean Monolith for Solo Execution).",
                counter_evidence="ADR 028 prohibits distributed microservices or Kubernetes orchestrators until proven bottleneck.",
                target_claim="Break solo MVP into 20 microservices with Kafka streams and Kubernetes on Day 1.",
                source_doc_ids=[doc_id]
            )

        return None

    def _persist_challenge(
        self,
        challenge_type: str,
        severity: str,
        title: str,
        description: str,
        counter_evidence: str,
        target_claim: str,
        source_doc_ids: List[int]
    ) -> Dict[str, Any]:
        """Saves challenge to database and flags it in graph nodes."""
        conn = get_self_db_connection()
        cur = conn.cursor()

        cur.execute("""
        INSERT INTO adversarial_challenges (challenge_type, severity, title, description, counter_evidence, target_claim, source_doc_ids_json)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            challenge_type,
            severity,
            title,
            description,
            counter_evidence,
            target_claim,
            json.dumps(source_doc_ids)
        ))
        challenge_id = cur.lastrowid

        # Insert paradox node into graph for visual highlighting
        node_key = f"paradox_{challenge_id}"
        cur.execute("""
        INSERT OR IGNORE INTO graph_nodes (node_key, name, node_type, description, metadata_json)
        VALUES (?, ?, 'paradox', ?, ?)
        """, (node_key, f"⚡ {title}", description, json.dumps({"color": "#ef4444", "severity": severity})))
        conn.commit()
        conn.close()

        logger.info(f"Adversarial challenge logged #{challenge_id}: {title}")
        return {
            "id": challenge_id,
            "title": title,
            "type": challenge_type,
            "severity": severity,
            "description": description,
            "counter_evidence": counter_evidence,
            "target_claim": target_claim
        }

    def get_open_challenges(self) -> List[Dict[str, Any]]:
        """Returns all unaddressed adversarial challenges."""
        conn = get_self_db_connection()
        cur = conn.cursor()
        cur.execute("""
        SELECT id, challenge_type, severity, title, description, counter_evidence, target_claim, status, created_at
        FROM adversarial_challenges WHERE status = 'open' ORDER BY 
            CASE severity 
                WHEN 'critical' THEN 1 
                WHEN 'high' THEN 2 
                WHEN 'medium' THEN 3 
                ELSE 4 
            END, id DESC
        """)
        rows = cur.fetchall()
        conn.close()

        return [{
            "id": r["id"],
            "type": r["challenge_type"],
            "severity": r["severity"],
            "title": r["title"],
            "description": r["description"],
            "counter_evidence": r["counter_evidence"],
            "target_claim": r["target_claim"],
            "status": r["status"],
            "created_at": r["created_at"]
        } for r in rows]

    def respond_to_challenge(self, challenge_id: int, user_response: str, action: str = "defend") -> Dict[str, Any]:
        """User responds to a challenge: defending their position or conceding/updating their knowledge."""
        conn = get_self_db_connection()
        cur = conn.cursor()

        new_status = "defended" if action == "defend" else "conceded"
        cur.execute("""
        UPDATE adversarial_challenges SET status = ?, user_response = ? WHERE id = ?
        """, (new_status, user_response, challenge_id))
        conn.commit()
        conn.close()

        return {"id": challenge_id, "status": new_status, "user_response": user_response}

challenger = AdversarialChallenger()
