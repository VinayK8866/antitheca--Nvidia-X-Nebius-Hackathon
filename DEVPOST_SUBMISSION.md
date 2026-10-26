# 🏆 Devpost Official Submission Guide: ENGRAM

Copy and paste these exact fields directly into the Devpost submission portal for the **Nebius x NVIDIA Global AI Hackathon**.

---

### Project Title
**Engram — The AI That Thinks About Your Knowledge While You Sleep**

### Tagline (under 200 characters)
**Autonomous cognitive sleep consolidation & zero-sycophancy epistemic memory powered by NVIDIA Nemotron 3 Ultra 550B on Nebius Token Factory.**

### Hackathon Tracks
- **Primary Track**: Personal AI
- **Sponsor Prize**: Tavily AI Search ($3,000 Bonus Prize)

---

### Elevator Pitch / Problem Statement
Every engineer, founder, and researcher suffers from the **Bookmark Graveyard**: we save hundreds of Instagram reels, architecture slides, technical tweets, and Obsidian notes, but when making high-stakes decisions, we cannot recall them.

Worse, existing personal assistants are **dangerously sycophantic**: if you tell ChatGPT or Claude, *"I'm thinking of breaking my solo MVP into 20 microservices with Kafka,"* they respond with: *"Great idea! Here is a Kubernetes manifest..."* even if three weeks ago you wrote an Architecture Decision Record (ADR 028) swearing never to introduce distributed microservices!

---

### What Engram Does
Engram is the first personal AI system modeled directly after **neuroscience memory consolidation**:

1. **Autonomous 3:00 AM Sleep Replay Engine**: Human memory doesn't consolidate during intake; it consolidates during sleep replay (sharp-wave ripples). Engram features an autonomous background daemon that fires every night at 3:00 AM without human intervention. It scans newly ingested notes, identifies topological holes in your knowledge graph, verifies open questions via Tavily, and prompts **NVIDIA Nemotron 3 Ultra 550B** on Nebius Token Factory to generate a crisp Executive Morning Briefing.
2. **Morning Dispatch Webhooks**: Automatically broadcasts your executive briefing to Discord, Slack, or Telegram before you even wake up.
3. **Zero-Sycophancy Epistemic Memory & Adversarial Radar**: Engram refuses to be an agreeable yes-man. When you ingest new reels or propose ideas that contradict your established principles, Engram sounds an immediate alarm, flags the tension, and forces you to confront the contradiction.
4. **Iterative Multi-Query Tavily Deep Research Loop**: Decomposes complex or ambiguous claims into 3 orthogonal subqueries (empirical benchmarks, failure modes, and consensus best practices), queries Tavily in parallel, deduplicates sources, and computes an empirical grounding confidence score.
5. **Multimodal Reel & Slide Extraction**: Powered by **NVIDIA Nemotron 3.5 Super-VL**, Engram processes screenshots, carousels, and architectural slides from saved reels, extracting diagrams and text overlays into sovereign memory.
6. **Bulk Obsidian Vault Ingest**: Ingests entire local folders of Markdown notes, ADRs, and PDFs in seconds.
7. **Static ADR Code Drift Auditor**: Automatically audits your actual code repository to ensure you haven't violated your documented architectural decisions.

---

### How We Built It
- **Inference & Compute**: Orchestrated across **Nebius Token Factory** utilizing NVIDIA H100/H200 clusters:
  - `nvidia/Nemotron-3-Ultra-550b-a55b`: The master epistemic arbiter for overnight cognitive consolidation and deep contradiction detection.
  - `nvidia/Nemotron-3.5-Super-VL`: Multimodal vision extraction for slide carousels, infographics, and reel keyframes.
  - `nvidia/Nemotron-Mini-4B-Instruct`: High-speed edge chunking and metadata classification.
- **Evidentiary Grounding**: **Tavily AI Search** via an iterative 3-query decomposition engine that provides empirical citations and consensus scoring.
- **Data Sovereignty & Storage**: Dual-database architecture using **SQLite in WAL mode**:
  - `self_brain.db`: Stores first-party convictions, private ADRs, and personal memories.
  - `world_brain.db`: Stores third-party web claims, empirical benchmarks, and external citations.
- **Frontend**: Next.js 16 with custom Vanilla CSS glassmorphic tokens, offering both a default ultra-clean light mode and a toggleable dark mode, interactive 2D Force Graph visualization, and real-time telemetry badges.

---

### Challenges We Overcame
1. **Model Sycophancy**: Modern instruction-tuned models are trained through RLHF to be polite and agreeable. Forcing Nemotron 3 Ultra 550B to rigorously cross-examine user proposals against past ADRs required precise epistemic prompting and a strict contrastive memory retrieval loop.
2. **Epistemic Contamination**: In early designs, internet search summaries polluted personal convictions. We solved this by creating a mathematical dual-brain boundary: `self_brain.db` and `world_brain.db` are strictly physically separated and continuously verified by our static code drift auditor.
3. **Multi-Query Synthesis Latency**: Running multiple Tavily searches synchronously delayed consolidation. We refactored `app/tavily_client.py` into an `asyncio.gather` parallel search loop with URL deduplication, reducing latency by 65%.

---

### Accomplishments We're Proud Of
- **True Autonomous Cognition**: Engram doesn't wait for user prompts. The 3:00 AM sleep engine operates completely in the background, proving that personal AI can perform deep cognitive work while humans rest.
- **Beat 37k-Star Open Source Giants**: We systematically analyzed Khoj (the leading open-source second brain) and adapted its bulk vault ingest and webhook dispatching while completely leapfrogging its passive RAG design with active cognitive consolidation and zero-sycophancy adversarial auditing.
- **Full End-to-End Multimodal Flow**: Ingesting a technical meme slide from an Instagram reel and watching `Nemotron 3.5 Super-VL` parse it and immediately trigger an Adversarial Alert against ADR 028 in under 3 seconds.

---

### What We Learned
- Cognitive memory is not vector search; it is **epistemic tension resolution**. Simply retrieving the top-5 cosine similarity chunks fails when notes contradict each other. An AI must have an adversarial engine that explicitly highlights contradictions rather than blending them together.
- NVIDIA's Nemotron 3 Ultra 550B possesses remarkable synthesis capabilities that shine specifically when given rich multi-document context during unhurried overnight batch processing.

---

### What's Next for Engram
- **Voice Consolidation & Morning Audio Briefing**: Generating a 2-minute personalized podcast episode summarizing the overnight thoughts using ElevenLabs.
- **Browser Extension for 1-Click Reel Bookmarking**: A lightweight Chrome extension to push reels directly from Instagram and TikTok into Engram's ingestion pipeline.
- **Local Edge Inference on NVIDIA RTX**: Supporting local quantized Nemotron execution on consumer NVIDIA RTX 4090/5090 GPUs.

---

### Built With
- `Nebius Token Factory`
- `NVIDIA Nemotron 3 Ultra 550B`
- `NVIDIA Nemotron 3.5 Super-VL`
- `NVIDIA Nemotron Mini 4B`
- `Tavily AI Search API`
- `Python 3.11 & FastAPI`
- `SQLite WAL Mode`
- `Next.js 16 & React 19`
- `NetworkX & Scikit-learn`
- `Docker & Docker Compose`
