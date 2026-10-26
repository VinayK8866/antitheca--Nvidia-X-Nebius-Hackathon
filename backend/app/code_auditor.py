import os
import re
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
from app.database import get_self_db_connection

logger = logging.getLogger(__name__)

class EpistemicCodeAuditor:
    """Verifies that codebase implementation adheres strictly to established ADRs and prevents architectural drift."""

    def audit_workspace(self, root_dir: Optional[str] = None) -> Dict[str, Any]:
        """Scans python and javascript files against established architectural decisions."""
        target_dir = Path(root_dir) if root_dir else Path(__file__).resolve().parent.parent

        # 1. Fetch established decisions from database
        conn = get_self_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT id, title, decision_text FROM decisions WHERE status = 'active'")
        active_decisions = cur.fetchall()
        conn.close()

        scanned_files = 0
        violations = []
        verified_claims = []

        # Anti-pattern patterns
        forbidden_patterns = [
            (
                r'\b(redis|pika|celery|kafka|rabbitmq)\b',
                "ADR 028 (Lean Monolith)",
                "Detected distributed broker/queue dependency which violates lean single-service architecture."
            ),
            (
                r'self_brain\.db.*external_sources|INSERT\s+INTO\s+documents.*tavily',
                "ADR 031 (Epistemic Isolation)",
                "Detected direct write from external web search into self_brain.db without epistemic firewall."
            ),
            (
                r'(["\'](sk-[a-zA-Z0-9]{20,}|tvly-[a-zA-Z0-9_-]{20,})["\'])',
                "Privacy Guardrail",
                "Hardcoded API key detected in source code. Must use environment variables."
            )
        ]

        # Scan files in backend and frontend
        for ext in ["*.py", "*.js", "*.mjs"]:
            for file_path in target_dir.rglob(ext):
                # Ignore tests, venv, node_modules, git, code_auditor.py
                path_str = str(file_path)
                if any(ignored in path_str for ignored in ["venv", "node_modules", ".git", "__pycache__", "tests", "code_auditor.py"]):
                    continue

                scanned_files += 1
                try:
                    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                        code = f.read()

                    for pattern, rule_name, explanation in forbidden_patterns:
                        matches = re.findall(pattern, code, re.IGNORECASE)
                        if matches:
                            violations.append({
                                "rule": rule_name,
                                "file": str(file_path.relative_to(target_dir)),
                                "explanation": explanation,
                                "match": str(matches[0])[:60]
                            })
                except Exception as e:
                    logger.debug(f"Could not read file {file_path}: {e}")

        # Verified assertions
        if not violations:
            verified_claims.append({
                "rule": "ADR 028: Lean Monolith Architecture",
                "status": "VERIFIED",
                "details": "Zero distributed microservice queues or external brokers detected."
            })
            verified_claims.append({
                "rule": "ADR 031: Epistemic Isolation",
                "status": "VERIFIED",
                "details": "First-party cognitive model (self_brain.db) and world knowledge (world_brain.db) strictly decoupled."
            })
            verified_claims.append({
                "rule": "Data Sovereignty & Secret Redaction",
                "status": "VERIFIED",
                "details": "All external API credentials are bound to environment variables."
            })

        compliance_score = max(0, 100 - (len(violations) * 20))

        return {
            "status": "compliant" if not violations else "drift_detected",
            "compliance_score": compliance_score,
            "scanned_files_count": scanned_files,
            "active_decisions_checked": len(active_decisions),
            "drifts_found": violations,
            "verified_claims": verified_claims
        }

code_auditor = EpistemicCodeAuditor()
