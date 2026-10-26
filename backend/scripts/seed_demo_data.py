import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import init_all_dbs
from app.ingest import ingest_pipeline
from app.tiered_memory import tiered_memory
from app.replay_engine import replay_engine
from app.challenger import challenger

print("=== 1. INITIALIZING DATABASE SCHEMAS ===")
init_all_dbs()

print("\n=== 2. SEEDING FOUNDATIONAL PERSONAL WISDOM & PRECEDENTS ===")
# Wisdom 1
tiered_memory.record_memory(
    learned_fact="Single-founder projects must minimize operational complexity. Prefer SQLite WAL and monoliths until traffic demands horizontal scaling.",
    category="engineering_axioms",
    initial_tier="tier_wisdom"
)
# Wisdom 2
tiered_memory.record_memory(
    learned_fact="Never blindly apply trending advice from social media. Always isolate external claims in staging before adopting them as personal practice.",
    category="mental_models",
    initial_tier="tier_wisdom"
)
# Fact 1
tiered_memory.record_memory(
    learned_fact="Next.js App Router performs best with pure Vanilla CSS tokens and server components for data retrieval.",
    category="frontend",
    initial_tier="tier_fact"
)

print("\n=== 3. INGESTING REALISTIC KNOWLEDGE ATOMS ===")

# Atom 1: Instagram Reel (Saved AI Post)
reel_1 = ingest_pipeline.ingest_text(
    title="Instagram Reel @aitechpulse: Autonomous Cognitive Sleep Loops",
    content=(
        "Saved Reel: How elite AI agents use human sleep cycles for memory consolidation. "
        "During idle periods, LLM agents process the day's event stream, recalculate [[Knowledge Graph]] edge weights, "
        "and proactively weed out dead links. Tools mentioned: #neuroscience #agenticAI #memory."
    ),
    modality="reel",
    tags=["instagram_reel", "cognitive_replay", "agentic_ai"]
)
print("Ingested Reel 1:", reel_1["title"])

# Atom 2: Architectural Decision (ADR)
adr_1 = ingest_pipeline.ingest_text(
    title="ADR 031: Epistemic Isolation Between First-Party and Third-Party Knowledge",
    content=(
        "Decision: Strictly isolate the user's personal cognitive notes in self_brain.db and external web scraped data "
        "in world_brain.db. Rationale: Prevents external hallucination contagion and guarantees user data sovereignty. "
        "Verified with [[Privacy Architecture]] and #security."
    ),
    modality="decision",
    tags=["architecture", "security", "privacy", "adr"]
)
print("Ingested ADR 1:", adr_1["title"])

# Atom 3: Tech Note on NVIDIA Nemotron
note_1 = ingest_pipeline.ingest_text(
    title="Engineering Note: Compute Tiering with NVIDIA Nemotron on Nebius Token Factory",
    content=(
        "Key benchmark: Nemotron-3-Nano (30B MoE) delivers sub-second latency for query classification and tag extraction, "
        "while Nemotron-3-Ultra (550B MoE) handles deep non-linear synthesis and adversarial cross-examination. "
        "Routing dynamically cuts token cost by 78% compared to single-model RAG. #nebius #nemotron #infrastructure."
    ),
    modality="note",
    tags=["nebius", "nemotron", "performance"]
)
print("Ingested Note 1:", note_1["title"])

# Atom 4: Contradictory Trend Entry (Triggers Adversarial Challenger!)
conflict_1 = ingest_pipeline.ingest_text(
    title="Saved Post: Break Everything into 20 Microservices from Day 1",
    content=(
        "Viral post argument: Even for a solo dev MVP, you should immediately break your backend into 20 isolated microservices, "
        "deploy Kubernetes clusters across 3 cloud regions, and use heavy distributed event buses. "
        "Monolithic architectures are completely dead and should never be used under any circumstances."
    ),
    modality="reel",
    tags=["instagram_reel", "microservices", "controversy"]
)
print("Ingested Conflicting Post:", conflict_1["title"])

print("\n=== 4. EXECUTING LIVE COGNITIVE REPLAY (NVIDIA Nemotron 3 Ultra + Tavily) ===")
replay_result = replay_engine.run_replay_cycle(force_all=True)
print("Replay Completed!")
print("Headline:", replay_result.get("headline"))
print("New connections:", replay_result.get("new_connections"))

print("\n=== 5. CHECKING ADVERSARIAL CHALLENGES ===")
open_challenges = challenger.get_open_challenges()
print(f"Total open challenges detected: {len(open_challenges)}")
for c in open_challenges:
    print(f"⚡ [{c['severity'].upper()}] {c['title']}")

print("\n Demo data seeded successfully with live Nemotron 3 Ultra reasoning!")
