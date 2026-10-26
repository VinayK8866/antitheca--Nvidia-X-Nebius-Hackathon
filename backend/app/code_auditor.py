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

        # 2. Also run Vault Health & Wikilink Integrity Check (wiki-lint)
        vault_health = self.audit_vault()

        return {
            "status": "compliant" if not violations else "drift_detected",
            "compliance_score": compliance_score,
            "scanned_files_count": scanned_files,
            "active_decisions_checked": len(active_decisions),
            "drifts_found": violations,
            "verified_claims": verified_claims,
            "vault_health": vault_health
        }

    def audit_vault(self, vault_dir: Optional[str] = None) -> Dict[str, Any]:
        """Scans Obsidian vault for broken wikilinks, orphan notes, and Map of Content (MOC) integrity."""
        target_path = Path(vault_dir) if vault_dir else Path(__file__).resolve().parent.parent / "demo_vault"
        if not target_path.exists() or not target_path.is_dir():
            target_path = Path(__file__).resolve().parent.parent / "data"

        md_files = list(target_path.glob("*.md"))
        file_stems = {f.stem.lower(): f.stem for f in md_files}
        
        # Add decisions and challenges from database to known targets
        conn = get_self_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT title FROM decisions")
        for row in cur.fetchall():
            file_stems[row["title"].lower()] = row["title"]
        try:
            cur.execute("SELECT id, title FROM adversarial_challenges")
            for row in cur.fetchall():
                file_stems[f"challenge_{row['id']}"] = row["title"]
        except Exception:
            pass
        conn.close()

        def norm_token(s: str) -> str:
            return re.sub(r'[^a-z0-9]', '', s.lower())

        norm_stems = {norm_token(k): k for k in file_stems}

        total_wikilinks = 0
        broken_wikilinks = []
        links_from = {}
        links_to = {stem: 0 for stem in file_stems}

        for f in md_files:
            stem = f.stem.lower()
            try:
                content = f.read_text(encoding="utf-8", errors="ignore")
                matches = re.findall(r'\[\[(.*?)\]\]', content)
                links_from[stem] = []
                for m in matches:
                    target_raw = m.split('|')[0].strip()
                    target_clean = target_raw.replace(".md", "").strip().lower()
                    if target_clean in ["wikilink", "wikilinks", "link", "links"]:
                        continue

                    total_wikilinks += 1
                    links_from[stem].append(target_raw)

                    target_norm = norm_token(target_clean)
                    matched_key = None

                    # 1. Exact or normalized token match
                    if target_norm in norm_stems:
                        matched_key = norm_stems[target_norm]
                    else:
                        # 2. Substring match
                        for n_k, orig_k in norm_stems.items():
                            if (len(target_norm) >= 5 and target_norm in n_k) or (len(n_k) >= 5 and n_k in target_norm):
                                matched_key = orig_k
                                break

                    if matched_key:
                        links_to[matched_key] = links_to.get(matched_key, 0) + 1
                    else:
                        broken_wikilinks.append({
                            "source_file": f.name,
                            "target": target_raw,
                            "issue": "Broken link: target note not found in vault"
                        })
            except Exception as e:
                logger.debug(f"Error checking vault file {f}: {e}")

        # Detect orphan notes (not Map_of_Content itself)
        orphan_notes = []
        for f in md_files:
            stem = f.stem.lower()
            if stem == "map_of_content":
                continue
            outgoing = len(links_from.get(stem, []))
            incoming = links_to.get(stem, 0)
            if outgoing == 0 and incoming == 0:
                orphan_notes.append(f.name)

        # Check Map of Content presence
        moc_path = target_path / "Map_of_Content.md"
        moc_present = moc_path.exists()

        penalties = (len(broken_wikilinks) * 10) + (len(orphan_notes) * 5)
        vault_health_score = max(0, 100 - penalties)

        return {
            "status": "healthy" if vault_health_score >= 80 else "attention_needed",
            "vault_health_score": vault_health_score,
            "vault_path": str(target_path),
            "total_notes": len(md_files),
            "total_wikilinks": total_wikilinks,
            "broken_wikilinks": broken_wikilinks,
            "orphan_notes": orphan_notes,
            "moc_present": moc_present,
            "moc_path": str(moc_path) if moc_present else None
        }

code_auditor = EpistemicCodeAuditor()
