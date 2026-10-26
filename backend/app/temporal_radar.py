import re
import json
import logging
from datetime import datetime, date
from typing import List, Dict, Any, Optional
from app.database import get_self_db_connection
from app.llm_client import llm_client

logger = logging.getLogger(__name__)

class TemporalCommitmentRadar:
    """Detects deadlines, time-sensitive commitments, and pending deliverables from notes and transcripts."""

    COMMITMENT_PATTERNS = [
        re.compile(r'(?:todo|must|need to|have to|action item|follow up with|deliver|submit|finish|ship|complete)\s+([^.\n]+?)(?:by\s+([a-zA-Z0-9\s,-]+?))?(?:\.|\n|$)', re.IGNORECASE),
        re.compile(r'deadline:\s*([^\n]+)', re.IGNORECASE),
        re.compile(r'-\s*\[ \]\s*([^\n]+)', re.IGNORECASE)
    ]

    def extract_commitments_from_text(self, doc_id: Optional[int], title: str, text: str) -> List[Dict[str, Any]]:
        """Extracts actionable temporal commitments using regex heuristics and fast model verification."""
        commitments = []
        lines = text.split("\n")
        
        # 1. Markdown checklist items: - [ ] Task description
        for line in lines:
            stripped = line.strip()
            if stripped.startswith("- [ ]") or stripped.startswith("* [ ]"):
                task_content = stripped[5:].strip()
                urgency = "high" if any(w in task_content.lower() for w in ["urgent", "asap", "critical", "today", "tomorrow"]) else "medium"
                
                # Check for deadline mention
                deadline_match = re.search(r'\b(by|before|until|due)\s+([a-zA-Z0-9\s,-]+)', task_content, re.IGNORECASE)
                deadline_str = deadline_match.group(2).strip() if deadline_match else None
                
                commitments.append({
                    "task_text": task_content,
                    "urgency": urgency,
                    "deadline_context": deadline_str or "Unscheduled",
                    "source_snippet": stripped[:120]
                })

        # 2. Heuristic regex matches for unstructured text
        if not commitments:
            for pat in self.COMMITMENT_PATTERNS:
                for match in pat.finditer(text):
                    snippet = match.group(0).strip()
                    if len(snippet) > 8 and not snippet.startswith("#"):
                        urgency = "high" if any(w in snippet.lower() for w in ["urgent", "critical", "asap", "today"]) else "medium"
                        commitments.append({
                            "task_text": snippet,
                            "urgency": urgency,
                            "deadline_context": "Flagged from notes",
                            "source_snippet": snippet[:120]
                        })

        # 3. If multiple raw sentences and still no commitments, run fast model if text mentions time
        if not commitments and any(w in text.lower() for w in ["deadline", "by thursday", "by friday", "deliverable", "due date", "milestone"]):
            prompt = f"Extract up to 2 specific actionable tasks or deadlines from this text in JSON format: [{{'task': '...', 'urgency': 'high'|'medium'|'low', 'deadline': '...'}}]. Text:\n{text[:500]}"
            raw = llm_client.query(prompt, system_prompt="Respond strictly with valid JSON array.", model_type="fast", max_tokens=150)
            try:
                data = json.loads(raw.strip().replace("```json", "").replace("```", "").strip())
                if isinstance(data, list):
                    for item in data:
                        commitments.append({
                            "task_text": item.get("task", ""),
                            "urgency": item.get("urgency", "medium"),
                            "deadline_context": item.get("deadline", "Upcoming"),
                            "source_snippet": text[:100]
                        })
            except Exception:
                pass

        # 4. Persist to database
        persisted = []
        if commitments:
            conn = get_self_db_connection()
            cur = conn.cursor()
            for c in commitments[:5]: # Cap per document
                # Prevent duplicate identical task
                cur.execute("SELECT id FROM temporal_commitments WHERE task_text = ? AND status = 'pending'", (c["task_text"],))
                if cur.fetchone():
                    continue

                cur.execute("""
                INSERT INTO temporal_commitments (doc_id, task_text, urgency, deadline_context, status, source_snippet)
                VALUES (?, ?, ?, ?, 'pending', ?)
                """, (doc_id, c["task_text"], c["urgency"], c["deadline_context"], c["source_snippet"]))
                c_id = cur.lastrowid
                persisted.append({**c, "id": c_id, "doc_id": doc_id, "title": title})
            conn.commit()
            conn.close()

        return persisted

    def get_open_commitments(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Returns all unresolved commitments grouped by urgency."""
        conn = get_self_db_connection()
        cur = conn.cursor()
        cur.execute("""
        SELECT tc.id, tc.doc_id, tc.task_text, tc.urgency, tc.deadline_date, tc.deadline_context, tc.status, tc.created_at, d.title as doc_title
        FROM temporal_commitments tc
        LEFT JOIN documents d ON tc.doc_id = d.id
        WHERE tc.status = 'pending'
        ORDER BY CASE tc.urgency 
            WHEN 'critical' THEN 1 
            WHEN 'high' THEN 2 
            WHEN 'medium' THEN 3 
            ELSE 4 END, tc.id DESC
        LIMIT ?
        """, (limit,))
        rows = cur.fetchall()
        conn.close()
        return [dict(r) for r in rows]

    def resolve_commitment(self, commitment_id: int, resolution: str = "completed") -> bool:
        """Marks a commitment as completed or dismissed."""
        conn = get_self_db_connection()
        cur = conn.cursor()
        cur.execute("UPDATE temporal_commitments SET status = ? WHERE id = ?", (resolution, commitment_id))
        conn.commit()
        updated = cur.rowcount > 0
        conn.close()
        return updated

temporal_radar = TemporalCommitmentRadar()
