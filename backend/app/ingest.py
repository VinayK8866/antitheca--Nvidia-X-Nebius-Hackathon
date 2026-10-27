import os
import hashlib
import json
import logging
from typing import Dict, Any, List, Optional
from pathlib import Path

from app.database import get_self_db_connection
from app.embeddings import generate_embedding, float_list_to_blob
from app.graph_engine import graph_engine, extract_hashtags, extract_wikilinks
from app.challenger import challenger
from app.redaction import redact_content
from app.media_extractor import extract_media_from_url, extract_pdf_content

logger = logging.getLogger(__name__)

CHUNK_SIZE = 500  # characters per chunk for dense semantic retrieval
CHUNK_OVERLAP = 100

def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> List[str]:
    """Splits text into overlapping semantic chunks."""
    if not text or len(text.strip()) == 0:
        return []
    
    clean_text = text.strip()
    if len(clean_text) <= chunk_size:
        return [clean_text]

    chunks = []
    start = 0
    while start < len(clean_text):
        end = start + chunk_size
        chunk = clean_text[start:end]
        chunks.append(chunk)
        start += (chunk_size - overlap)
    return chunks

class KnowledgeIngestionPipeline:
    """Unified ingestion pipeline turning text, URLs, and media into indexed knowledge atoms."""

    def ingest_text(
        self,
        title: str,
        content: str,
        modality: str = "note",
        tags: Optional[List[str]] = None,
        provenance: str = "self",
        source_path: Optional[str] = None
    ) -> Dict[str, Any]:
        """Ingests a text/markdown entry into self_brain.db."""
        # 1. Privacy & Secret Redaction
        sanitized_content, redacted_count = redact_content(content)
        if redacted_count > 0:
            logger.info(f"Redacted {redacted_count} sensitive tokens from entry: {title}")

        # 2. Extract Tags and Wikilinks
        auto_tags = extract_hashtags(sanitized_content)
        all_tags = list(set((tags or []) + auto_tags))
        wikilinks = extract_wikilinks(sanitized_content)

        file_hash = hashlib.sha256(sanitized_content.encode('utf-8')).hexdigest()

        # 3. Store Document
        conn = get_self_db_connection()
        cur = conn.cursor()

        target_path = source_path or f"note://{file_hash[:12]}"
        cur.execute("SELECT id FROM documents WHERE path = ?", (target_path,))
        existing_doc = cur.fetchone()
        if existing_doc:
            doc_id = existing_doc["id"]
            cur.execute("""
            UPDATE documents SET title = ?, modality = ?, provenance = ?, content = ?, summary = ?, tags_json = ?, file_hash = ?, is_processed_replay = 0, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """, (title, modality, provenance, sanitized_content, sanitized_content[:200], json.dumps(all_tags), file_hash, doc_id))
            cur.execute("DELETE FROM chunks WHERE doc_id = ?", (doc_id,))
        else:
            cur.execute("""
            INSERT INTO documents (title, path, file_type, modality, provenance, content, summary, tags_json, file_hash, is_processed_replay)
            VALUES (?, ?, 'md', ?, ?, ?, ?, ?, ?, 0)
            """, (
                title,
                target_path,
                modality,
                provenance,
                sanitized_content,
                sanitized_content[:200],
                json.dumps(all_tags),
                file_hash
            ))
            doc_id = cur.lastrowid

        # 4. Chunk & Generate Embeddings
        chunks = chunk_text(sanitized_content)
        for idx, chunk in enumerate(chunks):
            vec = generate_embedding(chunk)
            blob = float_list_to_blob(vec)
            cur.execute("""
            INSERT INTO chunks (doc_id, chunk_index, content, embedding_blob)
            VALUES (?, ?, ?, ?)
            """, (doc_id, idx, chunk, blob))
            chunk_id = cur.lastrowid
            try:
                cur.execute("INSERT OR REPLACE INTO vec_chunks (chunk_id, embedding) VALUES (?, ?)", (chunk_id, blob))
            except Exception as e_vec:
                logger.debug(f"vec_chunks sync note: {e_vec}")

        conn.commit()
        conn.close()

        # 5. Weave into Knowledge Graph
        graph_engine.sync_document_to_graph(doc_id, title, sanitized_content, modality)

        # 6. Run Adversarial Stress-Test
        challenge = challenger.evaluate_content_for_challenges(doc_id, title, sanitized_content)

        # 7. Extract Action Items & Temporal Commitments (Deadline Radar)
        from app.temporal_radar import temporal_radar
        extracted_commitments = temporal_radar.extract_commitments_from_text(doc_id, title, sanitized_content)

        logger.info(f"Ingested document #{doc_id}: '{title}' ({len(chunks)} chunks, commitments={len(extracted_commitments)})")
        return {
            "doc_id": doc_id,
            "title": title,
            "modality": modality,
            "chunks_count": len(chunks),
            "tags": all_tags,
            "wikilinks": wikilinks,
            "adversarial_challenge": challenge,
            "commitments": extracted_commitments,
            "status": "ingested_pending_replay"
        }

    def ingest_url(self, url: str) -> Dict[str, Any]:
        """Scrapes URL, extracts rich media or transcript, and ingests."""
        title, content, modality, meta = extract_media_from_url(url)
        tags = [modality]
        if "instagram" in url.lower():
            tags.append("instagram_reel")
        elif "tiktok" in url.lower():
            tags.append("tiktok_reel")
        elif "youtube" in url.lower():
            tags.append("youtube_video")

        is_reel = "instagram" in url.lower() or "tiktok" in url.lower()
        return self.ingest_text(
            title=title,
            content=content,
            modality="reel" if is_reel else modality,
            tags=tags,
            source_path=url
        )

    def ingest_image_bytes(self, image_bytes: bytes, filename: str = "slide.png") -> Dict[str, Any]:
        """
        Multimodal Image/Slide Ingestion Pipeline with end-to-end timestamped execution telemetry.
        Tracks time from raw bytes upload to visual extraction, chunk embedding, and database commit.
        """
        import time
        t_upload = time.perf_counter()
        raw_kb = len(image_bytes) / 1024

        from app.media_extractor import extract_image_content
        title, img_content, meta = extract_image_content(image_bytes, filename_or_url=filename)
        t_extracted = time.perf_counter()

        res = self.ingest_text(
            title=title,
            content=img_content,
            modality="image",
            tags=["slide_upload", "image", "multimodal"],
            source_path=f"upload://{filename}"
        )
        t_committed = time.perf_counter()

        total_pipeline_sec = t_committed - t_upload
        extraction_sec = t_extracted - t_upload
        ingest_db_sec = t_committed - t_extracted

        logger.info(
            f"[TIMING: END-TO-END MULTIMODAL INGESTION] '{filename}' ({raw_kb:.1f}KB) "
            f"TOTAL: {total_pipeline_sec:.2f}s | Visual Extraction: {extraction_sec:.2f}s | "
            f"Embed & SQLite Commit: {ingest_db_sec*1000:.1f}ms | Doc ID: #{res.get('doc_id')}"
        )
        res["pipeline_latency"] = {
            "total_sec": round(total_pipeline_sec, 3),
            "extraction_sec": round(extraction_sec, 3),
            "db_commit_ms": round(ingest_db_sec * 1000, 2),
            "payload_kb": round(raw_kb, 2)
        }
        return res

    def ingest_folder(self, folder_path: str) -> Dict[str, Any]:
        """Recursively scans and bulk-ingests a local directory or Obsidian vault."""
        path = Path(folder_path).expanduser().resolve()
        if not path.exists() or not path.is_dir():
            raise FileNotFoundError(f"Directory not found: {folder_path}")

        supported_exts = {".md", ".txt", ".json", ".png", ".jpg", ".jpeg", ".webp", ".pdf"}
        scanned_files = []
        for root, dirs, files in os.walk(path):
            dirs[:] = [d for d in dirs if not d.startswith(".")]
            for f in files:
                ext = os.path.splitext(f)[1].lower()
                if ext in supported_exts:
                    scanned_files.append(Path(root) / f)

        ingested = []
        skipped = 0
        challenges_found = 0

        for file_path in scanned_files:
            try:
                ext = file_path.suffix.lower()
                rel_path = file_path.relative_to(path).as_posix()
                stem = file_path.stem

                if ext in [".md", ".txt", ".json"]:
                    content = file_path.read_text(encoding="utf-8", errors="ignore")
                    if not content.strip():
                        skipped += 1
                        continue

                    lines = content.strip().split("\n")
                    title = stem
                    for line in lines:
                        if line.startswith("# "):
                            title = line.replace("# ", "").strip()
                            break

                    modality = "decision" if any(k in stem.lower() for k in ["adr", "decision", "rfc"]) else "note"
                    res = self.ingest_text(
                        title=title,
                        content=content,
                        modality=modality,
                        tags=["vault_import", modality],
                        source_path=str(file_path)
                    )
                    ingested.append({"title": title, "path": rel_path, "modality": modality})
                    if res.get("adversarial_challenge"):
                        challenges_found += 1

                elif ext in [".png", ".jpg", ".jpeg", ".webp"]:
                    from app.media_extractor import extract_image_content
                    bytes_data = file_path.read_bytes()
                    title, img_content, _ = extract_image_content(bytes_data, filename_or_url=stem)
                    res = self.ingest_text(
                        title=title,
                        content=img_content,
                        modality="image",
                        tags=["vault_import", "image"],
                        source_path=str(file_path)
                    )
                    ingested.append({"title": title, "path": rel_path, "modality": "image"})
                    if res.get("adversarial_challenge"):
                        challenges_found += 1

                elif ext == ".pdf":
                    bytes_data = file_path.read_bytes()
                    title, pdf_content, _ = extract_pdf_content(bytes_data, filename=stem)
                    res = self.ingest_text(
                        title=title,
                        content=pdf_content,
                        modality="pdf",
                        tags=["vault_import", "pdf"],
                        source_path=str(file_path)
                    )
                    ingested.append({"title": title, "path": rel_path, "modality": "pdf"})
                    if res.get("adversarial_challenge"):
                        challenges_found += 1

            except Exception as e:
                logger.warning(f"Error ingesting file {file_path}: {e}")
                skipped += 1

        return {
            "folder": str(path),
            "scanned_count": len(scanned_files),
            "ingested_count": len(ingested),
            "skipped_count": skipped,
            "challenges_flagged": challenges_found,
            "items": ingested[:20]
        }

ingest_pipeline = KnowledgeIngestionPipeline()
