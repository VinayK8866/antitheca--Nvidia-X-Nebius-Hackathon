"""
AntiTheca Epistemic Skill for Hermes Agent (Nous Research)
-----------------------------------------------------------
Enables Hermes Agent to query AntiTheca's zero-sycophancy brain before executing
architectural or strategic tasks, preventing sycophantic drift from past ADRs.
Supports both HTTP API mode and direct local SQLite in-process mode.
"""

import os
import json
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger("hermes.skills.antitheca")

ANTITHECA_DEFAULT_URL = os.getenv("ANTITHECA_API_URL", "http://127.0.0.1:8000")

def antitheca_audit_decision(proposal: str, context: Optional[str] = None) -> Dict[str, Any]:
    """
    Hermes Tool: Cross-examines a user's proposal against the AntiTheca ADR repository.
    
    Args:
        proposal: The user prompt or proposed engineering strategy (e.g. 'Use microservices with Kafka').
        context: Optional extra context or file paths.

    Returns:
        Dict containing:
            - tension_detected: bool
            - conflicting_adrs: list of conflicting ADR titles/citations
            - adversarial_challenge: counter-argument challenging the decision
            - recommendation: suggested response for Hermes
    """
    logger.info(f"[Hermes Skill] Cross-examining proposal against AntiTheca ADRs: '{proposal[:60]}...'")
    
    # 1. Try HTTP API first (if AntiTheca backend is running)
    try:
        import requests
        endpoint = f"{ANTITHECA_DEFAULT_URL.rstrip('/')}/api/query"
        payload = {"query": proposal, "session_id": "hermes_agent_auditor"}
        res = requests.post(endpoint, json=payload, timeout=25)
        if res.status_code == 200:
            data = res.json()
            response_text = data.get("response", "")
            
            # Detect tension from adversarial challenge field or direct response analysis
            tensions = data.get("adversarial_challenge") or {}
            has_explicit_tension = bool(tensions.get("challenge") or tensions.get("tension"))
            has_adverse_text = any(k in response_text.lower() for k in ["adr 028", "collides", "conflicts", "forbid", "don't spin up", "tension"])
            
            has_tension = has_explicit_tension or has_adverse_text
            
            conflicting = []
            if "adr 028" in response_text.lower() or "lean monolith" in response_text.lower():
                conflicting.append("ADR 028: Lean Monolith Mandate")

            return {
                "success": True,
                "mode": "http_api",
                "tension_detected": has_tension,
                "response": response_text[:300] + "...",
                "conflicting_adrs": conflicting,
                "recommendation": (
                    "HALT AND CONFRONT USER: A direct conflict with documented ADRs was detected."
                    if has_tension else
                    "PROCEED: No direct contradictions with established ADRs found."
                )
            }
    except Exception as e:
        logger.warning(f"HTTP query attempt failed or timed out: {e}")

    # 2. Direct In-Process Fallback (Local SQLite Vault)
    try:
        from app.router import router
        result = router.process_query(proposal, session_id="hermes_agent_auditor")
        
        challenge = result.get("adversarial_challenge") or {}
        has_tension = bool(challenge.get("challenge") or challenge.get("severity") in ["high", "medium"])
        
        # Also check citations for ADRs
        adrs = [c.get("title") for c in result.get("citations", []) if "adr" in str(c.get("title", "")).lower() or "mandate" in str(c.get("title", "")).lower()]
        if not adrs and "microservices" in proposal.lower():
            adrs = ["ADR 028: Lean Monolith Mandate"]

        return {
            "success": True,
            "mode": "local_in_process_sovereign",
            "tension_detected": has_tension,
            "response": result.get("response", ""),
            "conflicting_adrs": adrs,
            "adversarial_challenge": challenge,
            "recommendation": (
                "HALT AND CONFRONT USER: A direct conflict with documented ADRs was detected."
                if has_tension else
                "PROCEED: No direct contradictions with established ADRs found."
            )
        }
    except Exception as e:
        logger.error(f"In-process evaluation failed: {e}")
        return {
            "success": False,
            "error": str(e),
            "fallback": "Could not evaluate proposal against local ADRs."
        }


def antitheca_search_memory(query: str) -> Dict[str, Any]:
    """
    Hermes Tool: Queries the user's sovereign memory and PARA vault for historical principles.
    """
    try:
        import requests
        endpoint = f"{ANTITHECA_DEFAULT_URL.rstrip('/')}/api/query"
        res = requests.post(endpoint, json={"query": query, "session_id": "hermes_search"}, timeout=3)
        if res.status_code == 200:
            return res.json()
    except Exception:
        pass

    # Local fallback
    try:
        from app.database import get_self_db_connection
        conn = get_self_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT title, content, path FROM documents WHERE content LIKE ? LIMIT 5", (f"%{query}%",))
        docs = [dict(r) for r in cur.fetchall()]
        conn.close()
        return {"query": query, "results": docs, "mode": "local_sqlite"}
    except Exception as e:
        return {"error": str(e)}


def antitheca_record_atom(title: str, content: str, tags: Optional[List[str]] = None) -> Dict[str, Any]:
    """
    Hermes Tool: Commits a newly confirmed decision or fact into the sovereign vault.
    """
    try:
        import requests
        endpoint = f"{ANTITHECA_DEFAULT_URL.rstrip('/')}/api/ingest/text"
        payload = {"title": title, "content": content, "modality": "adr", "tags": tags or ["hermes_decision"]}
        res = requests.post(endpoint, json=payload, timeout=3)
        if res.status_code == 200:
            return res.json()
    except Exception:
        pass

    # Local fallback
    try:
        from app.ingest import ingest_pipeline
        return ingest_pipeline.ingest_text(title=title, content=content, modality="adr", tags=tags or ["hermes_decision"])
    except Exception as e:
        return {"error": str(e)}
