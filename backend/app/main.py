import os
import logging
from contextlib import asynccontextmanager
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.config import settings
from app.database import init_all_dbs, get_self_db_connection
from app.llm_client import llm_client
from app.tavily_client import tavily_client
from app.graph_engine import graph_engine
from app.tiered_memory import tiered_memory
from app.replay_engine import replay_engine
from app.challenger import challenger
from app.activator import activator
from app.ingest import ingest_pipeline
from app.router import router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("engram")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Engram Epistemic Engine...")
    init_all_dbs()
    logger.info("Database schemas confirmed.")
    yield
    logger.info("Shutting down Engram...")

app = FastAPI(
    title="Engram — Autonomous Personal Cognitive Intelligence",
    description="The AI that thinks about your knowledge while you sleep. Powered by NVIDIA Nemotron & Nebius Token Factory.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Request / Response Schemas
# ---------------------------------------------------------------------------

class IngestTextRequest(BaseModel):
    title: str
    content: str
    modality: str = "note"
    tags: Optional[List[str]] = None

class IngestUrlRequest(BaseModel):
    url: str

class QueryRequest(BaseModel):
    query: str
    session_id: str = "default_user"

class ChallengeResponseRequest(BaseModel):
    user_response: str
    action: str = Field(default="defend", description="'defend' or 'concede'")

class MemoryCreateRequest(BaseModel):
    learned_fact: str
    category: str = "general"
    tier: str = "tier_working"
    tags: Optional[List[str]] = None

# ---------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------

@app.get("/")
def root():
    return {
        "project": "Engram",
        "description": "The AI That Thinks About Your Knowledge While You Sleep",
        "powered_by": "NVIDIA Nemotron & Nebius Token Factory",
        "tavily_enabled": tavily_client.is_live,
        "nebius_live": llm_client.is_live,
        "status": "online"
    }

@app.get("/api/status")
def get_system_status():
    """Returns real-time status of models, databases, and memory ladder."""
    conn = get_self_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT COUNT(*) as cnt FROM documents")
    total_docs = cur.fetchone()["cnt"]

    cur.execute("SELECT COUNT(*) as cnt FROM documents WHERE is_processed_replay = 0")
    pending_replay = cur.fetchone()["cnt"]

    cur.execute("SELECT COUNT(*) as cnt FROM graph_nodes")
    total_nodes = cur.fetchone()["cnt"]

    cur.execute("SELECT COUNT(*) as cnt FROM graph_edges")
    total_edges = cur.fetchone()["cnt"]

    cur.execute("SELECT COUNT(*) as cnt FROM memories WHERE status = 'active'")
    total_memories = cur.fetchone()["cnt"]

    cur.execute("SELECT COUNT(*) as cnt FROM adversarial_challenges WHERE status = 'open'")
    open_challenges = cur.fetchone()["cnt"]

    cur.execute("SELECT COUNT(*) as cnt FROM replay_briefings")
    total_briefings = cur.fetchone()["cnt"]

    conn.close()

    return {
        "nebius": {
            "is_live": llm_client.is_live,
            "reasoning_model": llm_client.reasoning_model,
            "fast_model": llm_client.fast_model,
            "base_url": llm_client.base_url
        },
        "tavily": {
            "is_live": tavily_client.is_live
        },
        "epistemic_stats": {
            "total_knowledge_atoms": total_docs,
            "pending_overnight_replay": pending_replay,
            "graph_nodes": total_nodes,
            "graph_edges": total_edges,
            "active_tiered_memories": total_memories,
            "open_adversarial_challenges": open_challenges,
            "briefings_generated": total_briefings
        }
    }

# 1. Ingestion Endpoints
@app.post("/api/ingest/text")
def ingest_text_endpoint(req: IngestTextRequest):
    result = ingest_pipeline.ingest_text(
        title=req.title,
        content=req.content,
        modality=req.modality,
        tags=req.tags
    )
    return result

@app.post("/api/ingest/url")
def ingest_url_endpoint(req: IngestUrlRequest):
    result = ingest_pipeline.ingest_url(req.url)
    return result

# 2. Query / RAG / Arbitrage Endpoint
@app.post("/api/query")
def query_endpoint(req: QueryRequest):
    result = router.process_query(query=req.query, session_id=req.session_id)
    return result

# 3. Cognitive Replay Endpoints
@app.post("/api/replay/trigger")
def trigger_replay_endpoint(force_all: bool = False):
    result = replay_engine.run_replay_cycle(force_all=force_all)
    return result

@app.get("/api/replay/latest")
def get_latest_replay_briefing():
    briefing = replay_engine.get_latest_briefing()
    if not briefing:
        return {"briefing": None, "message": "No cognitive replay briefings generated yet."}
    return briefing

# 4. Knowledge Graph Visualization
@app.get("/api/graph")
def get_graph_data():
    return graph_engine.export_3d_graph_json()

# 5. Adversarial Challenges
@app.get("/api/challenges")
def get_challenges():
    return challenger.get_open_challenges()

@app.post("/api/challenges/{challenge_id}/respond")
def respond_to_challenge(challenge_id: int, req: ChallengeResponseRequest):
    return challenger.respond_to_challenge(challenge_id, req.user_response, action=req.action)

# 6. Tiered Memories
@app.get("/api/memories")
def get_memories(category: Optional[str] = None):
    return tiered_memory.get_active_memories(category=category)

@app.post("/api/memories")
def create_memory(req: MemoryCreateRequest):
    return tiered_memory.record_memory(
        learned_fact=req.learned_fact,
        category=req.category,
        initial_tier=req.tier,
        tags=req.tags
    )

# 7. Proactive Knowledge Arbitrage
@app.post("/api/arbitrage")
def check_arbitrage(context: Dict[str, str]):
    text = context.get("text", "")
    return activator.find_arbitrage_opportunities(text)
