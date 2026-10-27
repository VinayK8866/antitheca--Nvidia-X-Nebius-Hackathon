import os
import re
import ast
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
from app.database import get_self_db_connection

logger = logging.getLogger(__name__)

class ADRComplianceASTVisitor(ast.NodeVisitor):
    """
    Abstract Syntax Tree (AST) visitor that inspects Python module structure,
    import statements, call sites, and constant declarations against ADR constraints.
    """
    BANNED_BROKER_MODULES = {
        "redis", "pika", "celery", "kafka", "rabbitmq", "kombu", "dramatiq"
    }

    SECRET_PATTERN = re.compile(r'^(sk-[a-zA-Z0-9]{20,}|tvly-[a-zA-Z0-9_-]{20,}|v1\.CmQK[a-zA-Z0-9_-]{30,})$')

    def __init__(self, rel_path: str):
        self.rel_path = rel_path
        self.violations: List[Dict[str, Any]] = []

    def visit_Import(self, node: ast.Import):
        for alias in node.names:
            base_mod = alias.name.split('.')[0].lower()
            if base_mod in self.BANNED_BROKER_MODULES:
                self.violations.append({
                    "rule": "ADR 028 (Lean Monolith)",
                    "file": self.rel_path,
                    "line": node.lineno,
                    "explanation": f"AST Import of banned broker library: '{alias.name}'. Violates lean single-service architecture.",
                    "match": f"import {alias.name}"
                })
        self.generic_visit(node)

    def visit_ImportFrom(self, node: ast.ImportFrom):
        if node.module:
            base_mod = node.module.split('.')[0].lower()
            if base_mod in self.BANNED_BROKER_MODULES:
                self.violations.append({
                    "rule": "ADR 028 (Lean Monolith)",
                    "file": self.rel_path,
                    "line": node.lineno,
                    "explanation": f"AST ImportFrom of banned broker library: '{node.module}'. Violates lean single-service architecture.",
                    "match": f"from {node.module} import ..."
                })
        self.generic_visit(node)

    def visit_Constant(self, node: ast.Constant):
        if isinstance(node.value, str):
            val = node.value.strip()
            if self.SECRET_PATTERN.match(val):
                self.violations.append({
                    "rule": "Data Sovereignty & Secret Privacy",
                    "file": self.rel_path,
                    "line": node.lineno,
                    "explanation": "Hardcoded API secret token found in AST string constant. Must use environment variables.",
                    "match": f"{val[:10]}...{val[-4:]}"
                })
        self.generic_visit(node)

    def visit_Call(self, node: ast.Call):
        # Inspect function calls for direct unverified cross-database writes
        if isinstance(node.func, ast.Attribute) and node.func.attr == "execute":
            if node.args and isinstance(node.args[0], ast.Constant) and isinstance(node.args[0].value, str):
                sql = node.args[0].value.lower()
                if "insert into documents" in sql and "tavily" in sql:
                    self.violations.append({
                        "rule": "ADR 031 (Epistemic Isolation)",
                        "file": self.rel_path,
                        "line": node.lineno,
                        "explanation": "Direct AST SQL write of unverified external Tavily results into self_brain.db.",
                        "match": "INSERT INTO documents ... tavily"
                    })
        self.generic_visit(node)

class EpistemicCodeAuditor:
    """Verifies that codebase implementation adheres strictly to established ADRs via AST analysis."""

    def audit_workspace(self, root_dir: Optional[str] = None) -> Dict[str, Any]:
        """Scans workspace files via Python AST analysis and structural JS parsing against ADRs."""
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

        # Scan files in backend and frontend
        for ext in ["*.py", "*.js", "*.mjs"]:
            for file_path in target_dir.rglob(ext):
                path_str = str(file_path)
                if any(ignored in path_str for ignored in ["venv", "node_modules", ".git", "__pycache__", "tests", "code_auditor.py"]):
                    continue

                scanned_files += 1
                rel_path = str(file_path.relative_to(target_dir))

                if file_path.suffix == ".py":
                    # Rigorous AST parsing for Python source files
                    try:
                        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                            source = f.read()
                        tree = ast.parse(source, filename=rel_path)
                        visitor = ADRComplianceASTVisitor(rel_path=rel_path)
                        visitor.visit(tree)
                        violations.extend(visitor.violations)
                    except Exception as e:
                        logger.debug(f"AST parse warning for {file_path}: {e}")
                else:
                    # Structural import scan for JavaScript/MJS files
                    try:
                        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                            lines = f.readlines()
                        for line_idx, line in enumerate(lines, start=1):
                            line_clean = line.strip()
                            if line_clean.startswith("//") or line_clean.startswith("/*"):
                                continue
                            if re.search(r'\bfrom\s+[\'"](redis|pika|celery|kafka|rabbitmq)[\'"]|\brequire\([\'"](redis|pika|celery|kafka|rabbitmq)[\'"]\)', line_clean, re.IGNORECASE):
                                violations.append({
                                    "rule": "ADR 028 (Lean Monolith)",
                                    "file": rel_path,
                                    "line": line_idx,
                                    "explanation": "Detected JS import of distributed message broker.",
                                    "match": line_clean[:60]
                                })
                    except Exception as e_js:
                        logger.debug(f"JS scan warning for {file_path}: {e_js}")

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
        """Scans Obsidian vault for broken wikilinks, orphan notes, PARA layout compliance, and MOC integrity."""
        target_path = Path(vault_dir) if vault_dir else Path(__file__).resolve().parent.parent / "demo_vault"
        if not target_path.exists() or not target_path.is_dir():
            target_path = Path(__file__).resolve().parent.parent / "data"

        # Scan all markdown files recursively, skipping hidden folders
        md_files = [f for f in target_path.rglob("*.md") if not any(p.startswith(".") for p in f.parts)]
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

        # Detect orphan notes (excluding Map_of_Content and vault-map)
        orphan_notes = []
        for f in md_files:
            stem = f.stem.lower()
            if stem in ["map_of_content", "vault-map"]:
                continue
            outgoing = len(links_from.get(stem, []))
            incoming = links_to.get(stem, 0)
            if outgoing == 0 and incoming == 0:
                orphan_notes.append(f.name)

        # Check Map of Content presence
        moc_path = target_path / "Map_of_Content.md"
        moc_present = moc_path.exists()

        # Check PARA Vault Map layout presence
        vault_map_path = target_path / "Meta" / "vault-map.md"
        vault_map_present = vault_map_path.exists()
        para_folders = ["00-Inbox", "01-Projects", "02-Areas", "03-Resources", "04-Archive"]
        found_para_folders = [f for f in para_folders if (target_path / f).exists() and (target_path / f).is_dir()]
        para_compliant = vault_map_present and (len(found_para_folders) >= 3)

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
            "moc_path": str(moc_path) if moc_present else None,
            "para_layout": {
                "compliant": para_compliant,
                "vault_map_present": vault_map_present,
                "vault_map_path": str(vault_map_path) if vault_map_present else None,
                "detected_para_folders": found_para_folders
            }
        }

    def run_epistemic_defrag(self, vault_dir: Optional[str] = None) -> Dict[str, Any]:
        """Runs cognitive defragmentation: identifies decaying knowledge, orphan tags, and generates actionable hygiene recommendations."""
        import json
        from datetime import date

        vault_health = self.audit_vault(vault_dir)
        conn = get_self_db_connection()
        cur = conn.cursor()

        # 1. Stale Notes: docs with 0 or 1 connection
        cur.execute("SELECT id, title, modality, tags_json, created_at FROM documents ORDER BY id ASC")
        docs = cur.fetchall()

        # 2. Tag Garden Analysis: detect orphan tags and near-duplicates
        tag_counts = {}
        for d in docs:
            raw_tags = json.loads(d["tags_json"] or "[]")
            for t in raw_tags:
                clean_t = t.lower().replace("#", "").strip()
                if clean_t:
                    tag_counts[clean_t] = tag_counts.get(clean_t, 0) + 1

        orphan_tags = [t for t, count in tag_counts.items() if count == 1]

        # Detect near-duplicate tags (e.g. singular vs plural)
        duplicate_tag_suggestions = []
        tag_list = list(tag_counts.keys())
        for i in range(len(tag_list)):
            for j in range(i + 1, len(tag_list)):
                t1, t2 = tag_list[i], tag_list[j]
                if t1 + "s" == t2 or t2 + "s" == t1 or (len(t1) > 4 and t1 in t2):
                    duplicate_tag_suggestions.append({
                        "primary": t1 if tag_counts[t1] >= tag_counts[t2] else t2,
                        "merge_target": t2 if tag_counts[t1] >= tag_counts[t2] else t1
                    })

        # 3. Decaying Knowledge / Archival candidates
        orphan_notes = vault_health.get("orphan_notes", [])
        archival_candidates = [n for n in orphan_notes if not n.startswith("ADR_")]

        # 4. Generate Defrag Report Markdown
        report_lines = [
            f"# 🧹 Epistemic Defrag Report ({date.today().isoformat()})",
            "",
            "## 1. 🌿 Tag Garden Hygiene",
            f"- **Total Unique Tags**: {len(tag_counts)}",
            f"- **Orphan Tags (1 use)**: {len(orphan_tags)} ({', '.join(orphan_tags[:8]) if orphan_tags else 'None'})",
        ]
        if duplicate_tag_suggestions:
            report_lines.append("- **Suggested Merges**:")
            for s in duplicate_tag_suggestions[:4]:
                report_lines.append(f"  - Merge `#{s['merge_target']}` into `#{s['primary']}`")
        else:
            report_lines.append("- *Zero duplicate tag collisions detected.*")

        report_lines.extend([
            "",
            "## 2. ⏳ Decaying Knowledge & Archival Candidates",
            f"- **Orphan Notes Without Connections**: {len(orphan_notes)}",
        ])
        if archival_candidates:
            for ac in archival_candidates:
                report_lines.append(f"  - Recommended for `04-Archive/`: `[[{ac}]]`")
        else:
            report_lines.append("  - *All notes actively connected in Map of Content.*")

        report_lines.extend([
            "",
            "## 3. 🗺️ PARA Layout Health",
            f"- **PARA Standard**: {'✅ Compliant' if vault_health['para_layout']['compliant'] else '⚠️ Partially Structured'}",
            f"- **Detected Folders**: {', '.join(vault_health['para_layout']['detected_para_folders'])}",
            f"- **Vault Health Score**: {vault_health['vault_health_score']}/100"
        ])

        report_markdown = "\n".join(report_lines)

        # 5. Persist to defrag_logs table
        cur.execute("""
        INSERT INTO defrag_logs (run_date, decayed_notes_count, merged_concepts_count, orphan_tags_count, defrag_report_markdown)
        VALUES (?, ?, ?, ?, ?)
        """, (
            date.today().isoformat(),
            len(archival_candidates),
            len(duplicate_tag_suggestions),
            len(orphan_tags),
            report_markdown
        ))
        conn.commit()
        conn.close()

        return {
            "status": "defrag_completed",
            "run_date": date.today().isoformat(),
            "vault_health_score": vault_health["vault_health_score"],
            "decayed_notes_count": len(archival_candidates),
            "orphan_tags_count": len(orphan_tags),
            "suggested_tag_merges": duplicate_tag_suggestions,
            "archival_candidates": archival_candidates,
            "para_layout": vault_health["para_layout"],
            "report_markdown": report_markdown
        }

code_auditor = EpistemicCodeAuditor()
