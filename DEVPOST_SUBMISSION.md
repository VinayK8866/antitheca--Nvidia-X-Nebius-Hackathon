# 🏆 Devpost Official Submission Guide: ANTITHECA

Copy and paste these exact fields directly into the Devpost submission portal for the **Nebius x NVIDIA Global AI Hackathon**.

---

### Project Title
**AntiTheca — The Adversarial Vault That Thinks While You Sleep**

### Tagline (under 200 characters)
**Autonomous cognitive sleep consolidation & zero-sycophancy epistemic memory powered by NVIDIA Nemotron 3 Ultra 550B on Nebius Token Factory.**

### Hackathon Tracks
- **Primary Track**: Personal AI
- **Sponsor Prize**: Tavily AI Search ($3,000 Bonus Prize)

---

### 🔗 Official Submission Links (Required by Devpost)
- **Public Live Demo URL**: `https://antitheca-demo.loca.lt` *(Live HTTPS tunnel via `./scripts/expose_live_demo.sh`)*
- **3-Minute Video Demo URL**: `https://youtu.be/YOUR_VIDEO_ID` *(3-Minute walkthrough — see [DEMO_VIDEO_SCRIPT.md](file:///home/user/Private_View/Vinay/Nebius%20Nvidia%20Hackathon/DEMO_VIDEO_SCRIPT.md))*
- **GitHub Repository**: `https://github.com/VinayK8866/antitheca--Nvidia-X-Nebius-Hackathon`

---

### 🧪 60-Second Live Evaluator Test Drive (For Hackathon Judges)
If evaluating live on the hosted public instance, follow these 3 steps to see the complete engine in action:
1. **Load Pre-Packaged Vault (Console Tab)**:
   - Click **Console** -> Select **"Vault Bulk"** -> Click **"Load Sample Engineering Vault (5 Notes & ADRs)"** -> Click **Ingest into Brain**.
   - Watch the Knowledge Graph and ADR precedents populate immediately.
2. **Trigger Zero-Sycophancy Adversarial Radar (Console Tab)**:
   - Click **"Reel / Slide"** -> Click **"Test Live Sample Slide: '20 Microservices Meme'"** -> Click **Ingest into Brain**.
   - Watch `NVIDIA Nemotron 3.5 Super-VL` parse the diagram and immediately flash a red **Adversarial Tension Badge** citing a violation of foundational **ADR 028** (*Lean Monolith Mandate*).
3. **Trigger Autonomous 3:00 AM Sleep Engine (Navbar)**:
   - Click **"Simulate 3:00 AM Cron Sleep"** in the top navigation bar.
   - Watch the engine execute parallel 3-query **Tavily Deep Research** and prompt **NVIDIA Nemotron 3 Ultra 550B** on Nebius Token Factory.
   - Switch to the **Daily Briefing** tab to inspect the consolidated morning executive report with Obsidian `[[wikilinks]]`.

---

### Elevator Pitch / Problem Statement
Every engineer, founder, and researcher suffers from the **Bookmark Graveyard**: we save hundreds of Instagram reels, architecture slides, technical tweets, and Obsidian notes, but when making high-stakes decisions, we cannot recall them.

Worse, existing personal assistants are **dangerously sycophantic**: if you tell ChatGPT or Claude, *"I'm thinking of breaking my solo MVP into 20 microservices with Kafka,"* they respond with: *"Great idea! Here is a Kubernetes manifest..."* even if three weeks ago you wrote an Architecture Decision Record (ADR 028) swearing never to introduce distributed microservices!

---

### What AntiTheca Does
AntiTheca (*Anti* + *Theca*, "The Adversarial Vault") is an autonomous personal AI system built around **unprompted overnight synthesis and zero-sycophancy adversarial verification**:

1. **Autonomous 3:00 AM Sleep Engine**: Knowledge compounds when synthesized asynchronously, not during hurried intake. AntiTheca features an autonomous background daemon that fires every night at 3:00 AM without human prompts. It traverses newly ingested notes, identifies structural gaps in your knowledge graph, verifies open technical questions via Tavily, and prompts **NVIDIA Nemotron 3 Ultra 550B** on Nebius Token Factory to generate a crisp Executive Morning Briefing.
2. **Morning Dispatch Webhooks**: Automatically broadcasts your executive briefing to Discord, Slack, or Telegram before you even wake up.
3. **Zero-Sycophancy Epistemic Memory & Adversarial Radar**: AntiTheca refuses to be an agreeable yes-man. When you ingest new reels or propose ideas that contradict your established principles, AntiTheca sounds an immediate alarm, flags the tension, and forces you to confront the contradiction.
4. **Iterative Multi-Query Tavily Deep Research Loop**: Decomposes complex or ambiguous claims into 3 orthogonal subqueries (empirical benchmarks, failure modes, and consensus best practices), queries Tavily in parallel, deduplicates sources, and computes an empirical grounding confidence score.
5. **Multimodal Reel & Slide Extraction**: Powered by **NVIDIA Nemotron 3.5 Super-VL**, AntiTheca processes screenshots, carousels, and architectural slides from saved reels, extracting diagrams and text overlays into sovereign memory.
6. **Native PARA Vault Standard & Obsidian Interoperability**: Organizes knowledge according to the PARA method (Projects, Areas, Resources, Archive), auto-generating `Meta/vault-map.md`, bidirectional `[[wikilinks]]`, and an autonomous `Map_of_Content.md` index synced for Obsidian Graph View.
7. **Temporal Commitment & Deadline Radar**: Scans messy brain dumps and meeting notes for hidden deliverables and deadlines, grouping them by urgency and surfacing them in the Morning Dispatch.
8. **5-Phase Cognitive Defrag & Tag Garden Hygiene**: Periodically audits knowledge health, pruning orphan tags, flagging decaying notes that lack backlinks, and recommending archival candidates for `04-Archive/`.
9. **Static Epistemic AST Code Drift Auditor**: Automatically parses the Python Abstract Syntax Tree (`ast.NodeVisitor`) of the codebase to verify structural compliance with documented Architecture Decision Records (e.g. ADR 028 lean monolith boundaries, ADR 031 database isolation, and secret token sovereignty).

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
- **True Autonomous Cognition**: AntiTheca doesn't wait for user prompts. The 3:00 AM sleep engine operates completely in the background, proving that personal AI can perform deep cognitive work while humans rest.
- **Advancing Open-Source Second Brain Architecture**: We systematically studied established architectures like Khoj and Obsidian standards. While traditional tools excel at passive search and retrieval over static vaults, AntiTheca introduces active cognitive consolidation: an autonomous overnight sleep replay engine, strict dual-database epistemic isolation, and zero-sycophancy adversarial auditing that challenges architectural drift against past ADRs.
- **Full End-to-End Multimodal Flow**: Ingesting a technical meme slide from an Instagram reel and watching `Nemotron 3.5 Super-VL` parse it and immediately trigger an Adversarial Alert against ADR 028 in under 3 seconds.

---

### What We Learned
- Cognitive memory is not vector search; it is **epistemic tension resolution**. Simply retrieving the top-5 cosine similarity chunks fails when notes contradict each other. An AI must have an adversarial engine that explicitly highlights contradictions rather than blending them together.
- NVIDIA's Nemotron 3 Ultra 550B possesses remarkable synthesis capabilities that shine specifically when given rich multi-document context during unhurried overnight batch processing.

---

### What's Next for AntiTheca
- **Voice Consolidation & Morning Audio Briefing**: Generating a 2-minute personalized podcast episode summarizing the overnight thoughts using ElevenLabs.
- **Browser Extension for 1-Click Reel Bookmarking**: A lightweight Chrome extension to push reels directly from Instagram and TikTok into AntiTheca's ingestion pipeline.
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
