import sqlite3
import json
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from app.config import settings

logger = logging.getLogger(__name__)

SELF_DB_PATH = str(settings.SELF_DB_PATH)
WORLD_DB_PATH = str(settings.WORLD_DB_PATH)

def get_self_db_connection(db_path: Optional[str] = None) -> sqlite3.Connection:
    """Returns connection to first-party personal cognitive database (self_brain.db)."""
    target = db_path or SELF_DB_PATH
    Path(target).parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(target, timeout=60.0)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA busy_timeout=60000;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    conn.row_factory = sqlite3.Row
    try:
        import sqlite_vec
        conn.enable_load_extension(True)
        sqlite_vec.load(conn)
        conn.enable_load_extension(False)
    except Exception as e:
        logger.debug(f"sqlite_vec extension load note: {e}")
    return conn

def get_world_db_connection(db_path: Optional[str] = None) -> sqlite3.Connection:
    """Returns connection to external world knowledge database (world_brain.db)."""
    target = db_path or WORLD_DB_PATH
    Path(target).parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(target, timeout=60.0)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA busy_timeout=60000;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    conn.row_factory = sqlite3.Row
    return conn

def get_db_connection(db_path: Optional[str] = None, provenance: str = "self") -> sqlite3.Connection:
    """Intelligent connection getter routing to self or world brain."""
    if db_path:
        return get_self_db_connection(db_path)
    if provenance in ["external", "world"]:
        return get_world_db_connection()
    return get_self_db_connection()

# ---------------------------------------------------------------------------
# Database Schema Initialization
# ---------------------------------------------------------------------------

def init_self_db(db_path: Optional[str] = None):
    """Initializes the First-Party Cognitive Database (Self Brain)."""
    conn = get_self_db_connection(db_path)
    cursor = conn.cursor()

    # Documents / Knowledge Atoms
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        path TEXT UNIQUE,
        file_type TEXT NOT NULL,
        modality TEXT DEFAULT 'note', -- note, decision, essay, reel, post, transcript, code
        provenance TEXT DEFAULT 'self',
        content TEXT NOT NULL,
        summary TEXT,
        tags_json TEXT,
        file_hash TEXT,
        is_processed_replay INTEGER DEFAULT 0, -- 0 = pending overnight replay, 1 = replayed
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Chunks & Embeddings
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chunks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        doc_id INTEGER NOT NULL,
        chunk_index INTEGER NOT NULL,
        content TEXT NOT NULL,
        embedding_blob BLOB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (doc_id) REFERENCES documents (id) ON DELETE CASCADE
    );
    """)

    # High-Performance Vector Index (sqlite-vec)
    try:
        cursor.execute("""
        CREATE VIRTUAL TABLE IF NOT EXISTS vec_chunks USING vec0(
            chunk_id INTEGER PRIMARY KEY,
            embedding float[384] distance_metric=cosine
        );
        """)
        # Populate vec_chunks from existing chunks if any are unindexed
        cursor.execute("""
        INSERT INTO vec_chunks (chunk_id, embedding)
        SELECT id, embedding_blob FROM chunks
        WHERE embedding_blob IS NOT NULL
          AND id NOT IN (SELECT chunk_id FROM vec_chunks);
        """)
    except Exception as e_vec:
        logger.warning(f"Could not initialize vec_chunks virtual table: {e_vec}")

    # Personal Knowledge Graph Nodes
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS graph_nodes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        node_key TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        node_type TEXT NOT NULL, -- concept, document, memory, decision, tag, paradox
        description TEXT,
        metadata_json TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Personal Knowledge Graph Edges
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS graph_edges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_id INTEGER NOT NULL,
        target_id INTEGER NOT NULL,
        relation_type TEXT NOT NULL, -- wikilink, similarity, contradiction, supports, supersedes
        weight REAL DEFAULT 1.0,
        metadata_json TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(source_id, target_id, relation_type),
        FOREIGN KEY (source_id) REFERENCES graph_nodes (id) ON DELETE CASCADE,
        FOREIGN KEY (target_id) REFERENCES graph_nodes (id) ON DELETE CASCADE
    );
    """)

    # Tiered Memory Ladder (Working -> Fact -> Wisdom)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_query TEXT,
        learned_fact TEXT NOT NULL,
        category TEXT DEFAULT 'general',
        tier TEXT DEFAULT 'tier_working', -- tier_working (0.25), tier_fact (1.0), tier_wisdom (2.0)
        namespace TEXT DEFAULT 'default',
        weight REAL DEFAULT 1.0,
        occurrence_count INTEGER DEFAULT 1,
        last_observed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'active', -- active, superseded, decayed, archived
        tags_json TEXT,
        embedding_blob BLOB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    try:
        cursor.execute("ALTER TABLE memories ADD COLUMN embedding_blob BLOB")
    except Exception:
        pass

    # High-Performance Memory Vector Index (sqlite-vec)
    try:
        cursor.execute("""
        CREATE VIRTUAL TABLE IF NOT EXISTS vec_memories USING vec0(
            memory_id INTEGER PRIMARY KEY,
            embedding float[384] distance_metric=cosine
        );
        """)
        cursor.execute("""
        INSERT INTO vec_memories (memory_id, embedding)
        SELECT id, embedding_blob FROM memories
        WHERE embedding_blob IS NOT NULL
          AND id NOT IN (SELECT memory_id FROM vec_memories);
        """)
    except Exception as e_vec_m:
        logger.debug(f"Could not initialize vec_memories virtual table: {e_vec_m}")

    # Decisions & Case-Based Precedents
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS decisions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        context TEXT,
        decision_text TEXT NOT NULL,
        status TEXT DEFAULT 'active', -- active, superseded, challenged
        superseded_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS decision_reasons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        decision_id INTEGER NOT NULL,
        reason_text TEXT NOT NULL,
        status TEXT DEFAULT 'valid', -- valid, invalidated, challenged
        invalidated_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (decision_id) REFERENCES decisions (id) ON DELETE CASCADE
    );
    """)

    # Adversarial Second Brain: Challenges & Contradictions
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS adversarial_challenges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        challenge_type TEXT NOT NULL, -- contradiction, blind_spot, cognitive_bias, outdated_assumption
        severity TEXT DEFAULT 'medium', -- low, medium, high, critical
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        counter_evidence TEXT,
        source_doc_ids_json TEXT,
        target_claim TEXT,
        status TEXT DEFAULT 'open', -- open, acknowledged, defended, conceded
        user_response TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Cognitive Replay: Overnight Autonomous Processing Briefings
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS replay_briefings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        briefing_date DATE UNIQUE NOT NULL,
        headline TEXT NOT NULL,
        summary_markdown TEXT NOT NULL,
        new_connections_count INTEGER DEFAULT 0,
        contradictions_found_count INTEGER DEFAULT 0,
        gaps_researched_count INTEGER DEFAULT 0,
        payload_json TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Telemetry & Chat Interaction Logs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS interactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        query TEXT NOT NULL,
        response TEXT NOT NULL,
        intent TEXT,
        retrieved_context_json TEXT,
        model_used TEXT,
        latency_ms REAL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Temporal Commitments & Deadlines Extracted from Notes/Transcripts
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS temporal_commitments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        doc_id INTEGER,
        task_text TEXT NOT NULL,
        urgency TEXT DEFAULT 'medium', -- critical, high, medium, low
        deadline_date TEXT,
        deadline_context TEXT,
        status TEXT DEFAULT 'pending', -- pending, completed, dismissed
        source_snippet TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (doc_id) REFERENCES documents (id) ON DELETE CASCADE
    );
    """)

    # Cognitive Defrag & Knowledge Hygiene Logs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS defrag_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        run_date DATE NOT NULL,
        decayed_notes_count INTEGER DEFAULT 0,
        merged_concepts_count INTEGER DEFAULT 0,
        orphan_tags_count INTEGER DEFAULT 0,
        defrag_report_markdown TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Autonomous 3:00 AM Scheduler Run Audit Log (Persistent History)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS scheduler_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trigger_source TEXT NOT NULL,
        status TEXT NOT NULL,
        headline TEXT,
        replayed_atoms INTEGER DEFAULT 0,
        duration_sec REAL DEFAULT 0.0,
        dispatch_json TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Scheduler Distributed State & Concurrency Lock
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS scheduler_state (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    conn.commit()
    conn.close()
    logger.info("Initialized self_brain.db schema successfully.")

def init_world_db(db_path: Optional[str] = None):
    """Initializes the Third-Party External Knowledge Database (World Brain)."""
    conn = get_world_db_connection(db_path)
    cursor = conn.cursor()

    # External Web & Verified Research (Tavily Scrapes)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS external_sources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT UNIQUE,
        title TEXT NOT NULL,
        snippet TEXT,
        full_content TEXT,
        query_trigger TEXT,
        reliability_score REAL DEFAULT 0.8,
        retrieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Verified Fact Claims
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS world_facts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_id INTEGER,
        fact_statement TEXT NOT NULL,
        category TEXT,
        confidence REAL DEFAULT 0.85,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (source_id) REFERENCES external_sources (id) ON DELETE SET NULL
    );
    """)

    conn.commit()
    conn.close()
    logger.info("Initialized world_brain.db schema successfully.")

def init_all_dbs():
    """Initializes both self and world databases."""
    init_self_db()
    init_world_db()
