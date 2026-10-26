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

        cur.execute("""
        INSERT INTO documents (title, path, file_type, modality, provenance, content, summary, tags_json, file_hash, is_processed_replay)
        VALUES (?, ?, 'md', ?, ?, ?, ?, ?, ?, 0)
        """, (
            title,
            source_path or f"note://{file_hash[:12]}",
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

        conn.commit()
        conn.close()

        # 5. Weave into Knowledge Graph
        graph_engine.sync_document_to_graph(doc_id, title, sanitized_content, modality)

        # 6. Run Adversarial Stress-Test
        challenge = challenger.evaluate_content_for_challenges(doc_id, title, sanitized_content)

        logger.info(f"Ingested document #{doc_id}: '{title}' ({len(chunks)} chunks, modality={modality})")
        return {
            "doc_id": doc_id,
            "title": title,
            "modality": modality,
            "chunks_count": len(chunks),
            "tags": all_tags,
            "wikilinks": wikilinks,
            "adversarial_challenge": challenge,
            "status": "ingested_pending_replay"
        }

    def ingest_url(self, url: str) -> Dict[str, Any]:
        """Scrapes URL, extracts rich media or transcript, and ingests."""
        title, content, modality, meta = extract_media_from_url(url)
        tags = [modality]
        if "instagram" in url.lower():
            tags.append("instagram_reel")
        elif "youtube" in url.lower():
            tags.append("youtube_video")

        return self.ingest_text(
            title=title,
            content=content,
            modality="reel" if "instagram" in url.lower() else modality,
            tags=tags,
            source_path=url
        )

ingest_pipeline = KnowledgeIngestionPipeline()
