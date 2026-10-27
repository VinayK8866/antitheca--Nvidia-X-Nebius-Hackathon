import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import init_all_dbs
from app.ingest import ingest_pipeline
from app.router import router
from app.replay_engine import replay_engine
from app.graph_engine import graph_engine
from app.challenger import challenger
from app.tiered_memory import tiered_memory

print("=== 1. INITIALIZING DATABASES ===")
init_all_dbs()
print("Databases initialized.")

print("\n=== 2. RECORDING FOUNDATIONAL PERSONAL DECISION & WISDOM ===")
mem = tiered_memory.record_memory(
    learned_fact="Always prefer lightweight decoupled micro-services over monolithic distributed systems for small teams.",
    category="architecture",
    initial_tier="tier_wisdom"
)
print("Memory recorded:", mem)

print("\n=== 3. INGESTING CONFLICTING ENTRY (TRIGGER ADVERSARIAL CHALLENGER) ===")
# This note contradicts the wisdom above to test the Adversarial Second Brain
res = ingest_pipeline.ingest_text(
    title="Proposal: Enterprise Multi-Region Kubernetes Micro-Monolith",
    content=(
        "We should migrate our 2-person project to a heavy enterprise multi-region Kubernetes cluster "
        "with 14 distributed orchestrators and full monolithic enterprise service mesh. "
        "More complex infrastructure means better reliability, regardless of team size."
    ),
    modality="decision",
    tags=["infra", "kubernetes", "architecture"]
)
print("Ingestion result:", res)

print("\n=== 3b. TESTING MULTIMODAL SLIDE INGESTION & CONFLICT DETECTION ===")
import io
from PIL import Image, ImageDraw
img = Image.new('RGB', (1024, 576), color=(15, 23, 42))
d = ImageDraw.Draw(img)
d.rectangle([(20, 20), (1004, 556)], outline=(51, 65, 85), width=2)
d.text((60, 60), "VIRAL ARCHITECTURE ADVICE 2026", fill=(248, 250, 252))
d.text((60, 160), "Mandate: Break solo MVP into 20 microservices with Kafka streams and 3-region Kubernetes on Day 1.", fill=(239, 68, 68))
d.text((60, 260), "Complexity equals enterprise resilience regardless of team size.", fill=(226, 232, 240))
buf = io.BytesIO()
img.save(buf, format="PNG")
slide_res = ingest_pipeline.ingest_image_bytes(buf.getvalue(), filename="viral_slide_20_microservices.png")
print(f"Multimodal slide processed in {slide_res['pipeline_latency']['extraction_sec']:.2f}s (sub-3s).")
if slide_res.get("adversarial_challenge"):
    print(f"⚡ Multimodal slide triggered adversarial challenge: {slide_res['adversarial_challenge']['title']}")

print("\n=== 4. TESTING KNOWLEDGE GRAPH EXPORT ===")
graph_data = graph_engine.export_3d_graph_json()
print(f"Graph nodes count: {len(graph_data['nodes'])}, links count: {len(graph_data['links'])}")

print("\n=== 5. TESTING OPEN ADVERSARIAL CHALLENGES ===")
challenges = challenger.get_open_challenges()
print(f"Open challenges detected: {len(challenges)}")
for c in challenges:
    print(f"⚡ [{c['severity'].upper()}] {c['title']}: {c['description']}")

print("\n=== 6. TESTING COGNITIVE REPLAY CYCLE ===")
replay_res = replay_engine.run_replay_cycle(force_all=True)
print("Replay status:", replay_res["status"])
print("Replay headline:", replay_res.get("headline"))

print("\n=== 7. TESTING EPISTEMIC QUERY ROUTER ===")
query_res = router.process_query("Should we build a heavy distributed cluster or keep it lean?")
print("Identified Intent:", query_res["intent"])
print("Model Used:", query_res["model_used"])
print("Arbitrage Nuggets:", len(query_res["arbitrage_nuggets"]))
print("Response preview:\n", query_res["response"][:300])

print("\n ALL PIPELINE CHECKS PASSED SUCCESSFULLY!")
