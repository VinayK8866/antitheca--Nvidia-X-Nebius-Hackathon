# AntiTheca — High-Leverage Hackathon Roadmap & Final Steps

> **Goal**: Win the Nebius x NVIDIA Global AI Hackathon (Personal AI Track + $3K Tavily Bonus Prize).
> **Deadline**: October 30, 2026 at 10:30 PM IST (GMT+5:30).

---

## 🚀 Completed Innovation Milestones ("Think Big" Extensions)

All three high-impact additions are implemented, live, and verified end-to-end:

### 1. Multimodal Reel Keyframe Understanding (`NVIDIA Nemotron 3.5 Super-VL`)
- **Pipeline**: Ingest Instagram reel screenshots, infographics, and carousel slides via `POST /api/ingest/file`.
- **NVIDIA Vision**: `nvidia/Nemotron-3.5-Super-VL` on Nebius Token Factory extracts OCR text, workflow diagrams, and architectural recommendations from saved visual media.
- **Immediate Adversarial Cross-Check**: Extracted claims are automatically matched against `self_brain.db` ADRs. Tested live with the *"Break MVP into 20 Microservices"* meme slide, immediately flagging a high-severity contradiction against ADR 028!

### 2. Autonomous 3:00 AM Cron Sleep Engine (`app/scheduler.py`)
- **True Background Daemon**: Runs an `asyncio` background loop firing every night at 3:00 AM without human intervention.
- **Autonomous Sleep Replay**: Wakes up in the dark, aggregates pending knowledge atoms, builds cross-domain topological links, researches open gaps via Tavily, and prompts `nvidia/Nemotron-3-Ultra-550b-a55b` to generate the Morning Executive Briefing.
- **UI Integration**: Live status pill in the navbar showing `3:00 AM Cron: Active (in 11h 50m)` + `Simulate 3:00 AM Cron Sleep` one-click test button.

### 3. Epistemic AST Architectural Drift Audit (`app/code_auditor.py`)
- **AST Node Inspection**: Parses Python source files into Abstract Syntax Trees (`ast.NodeVisitor`) to detect structural code-level drift from documented architectural decisions (ADRs).
- **Checks Enforced**:
  - `ADR 028`: AST import/call inspection guaranteeing zero distributed microservices or message broker libraries (`kafka`, `celery`, `redis`).
  - `ADR 031`: AST call inspection enforcing strict isolation between first-party cognitive memory (`self_brain.db`) and external world data (`world_brain.db`).
  - `Data Sovereignty`: AST constant visitor verifying all external API tokens are bound to environment variables with zero plaintext credentials.
- **Adversarial Radar Card**: Displays real-time 100% compliance badge and verified claims in the UI.

### 4. Building Upon Open-Source Prior Art (Vault Standards & Interoperability)
- **Bulk Local Folder / Vault Ingest (`backend/app/ingest.py` & `demo_vault/`)**:
  - Interoperable with standard personal vaults from tools like Obsidian and Khoj.
  - Point AntiTheca at any directory of Markdown notes, ADRs, or images (`POST /api/ingest/folder`).
  - Tested with 5 engineering notes & ADRs ingested simultaneously in 3 seconds.
- **Morning Dispatch Webhook (`backend/app/dispatcher.py`)**:
  - Automatically dispatches 03:00 AM executive sleep briefings to Discord, Slack, or Telegram with rich color-coded embeds.
  - UI control in Daily Briefing view with live status pill and test dispatching.
- **Multi-Query Tavily Deep Research (`backend/app/tavily_client.py`)**:
  - Decomposes claims into 3 orthogonal subqueries (benchmarks, counter-arguments, consensus).
  - Deduplicates sources and synthesizes empirical confidence score.
  - Dedicated "Deep Research" trigger in Console with multi-source card view.

### 5. Obsidian LLM Wiki Standard & Vault Health Linter
- **Native Obsidian `[[Wikilinks]]`**: Bidirectional wikilink formatting across notes, ADRs, and sleep briefings making AntiTheca vaults 100% natively browsable in Obsidian Graph View and Canvas.
- **Autonomous `Map_of_Content.md`**: Auto-generated on every 03:00 AM sleep replay cycle, indexing ADRs, principles, contradictions, and empirical benchmarks.
- **Epistemic Vault Health Linter (`wiki-lint`)**: Live in-UI health audit reporting 100% health score, zero broken links, zero orphan notes, and an integrated MOC viewer.

---

## 🏆 Devpost Winning Submission Checklist

### A. Demo Video Script (≤ 3 Minutes — Strict Devpost Requirement)
- [x] **0:00 - 0:35 (The Hook — The Bookmark Graveyard & Sycophancy Trap)**:
  - Open on the problem: hundreds of saved tech bookmarks, architectural slides, and reels rot without recall.
  - Flash the sycophancy contrast: ChatGPT cheerleading a solo developer splitting their MVP into 20 microservices with Kafka, completely ignoring that ADR 028 strictly forbids it.
- [x] **0:35 - 1:15 (Adversarial Alarm — Multimodal Vision Ingestion)**:
  - Drop the *"20 Microservices & Kubernetes"* meme slide into the Ingest Station (or click sample slide).
  - Show `Nemotron 3.5 Super-VL` parse diagrams and OCR in under 3 seconds.
  - Show the red Adversarial Radar badge flash immediately, citing ADR 028 (*Lean Monolith for Solo Execution*) and refusing sycophantic approval.
- [x] **1:15 - 2:00 (Sleep Replay in Action — Autonomous Overnight Synthesis)**:
  - Click *"Simulate 3:00 AM Cron Sleep"* in the navbar.
  - Show the terminal logs executing live calls to **Nebius Token Factory** (`Nemotron 3 Ultra 550B`) and parallel 3-query **Tavily Deep Research** (benchmarks, failure modes, consensus).
  - *Production Note*: Fast-cut or speed-run the 15s LLM network roundtrip so zero dead air is broadcast.
- [x] **2:00 - 2:35 (The Morning Briefing, Graph & Webhook Dispatch)**:
  - Transition directly into the generated Daily Executive Briefing with Obsidian `[[wikilinks]]`.
  - Pan across the interactive 2D Knowledge Graph highlighting the tension bridge between the viral reel and ADR 028.
  - Show the Discord/Slack webhook dispatch notification received on the user's phone or desktop.
- [x] **2:35 - 3:00 (Architecture, Compute Tiering & Data Sovereignty)**:
  - High-speed architecture slide showing dual-database isolation (`self_brain.db` vs `world_brain.db`) and static AST code drift auditing.
  - Highlight Nebius Token Factory compute tiering across H100 clusters. Wrap on sovereign personal AI.

### B. Repository & Packaging
- [ ] Root `README.md` with high-resolution architecture diagrams (Mermaid), setup guide, and MIT License.
- [ ] Clean Dockerfile / Compose file for 1-command startup.
- [ ] Devpost project write-up detailing Track alignment and technical depth (`DEVPOST_SUBMISSION.md`).

---

## 🛠️ Post-Hackathon Roadmap (Production Engineering)

### 1. Embed Native Vector Indexing
- **Objective**: Scale vector retrieval from prototype memory scans to production-grade billion-scale performance.
- **Implementation**:
  - Replace the brute-force Python scan in `router.py:104-130` with `sqlite-vec` extension bindings or a dedicated embedded vector store (e.g., `usearch` or `chromadb` in-process).
  - Guarantee sub-50ms nearest-neighbor lookups over 100,000+ chunks with zero GIL contention and minimal memory overhead.

### 2. Decouple Background Scheduling from the Web Process
- **Objective**: Eliminate in-process scheduler fragility, ASGI worker race conditions, and serverless teardown issues.
- **Implementation**:
  - Extract the 3:00 AM consolidation engine from the FastAPI event loop into an independent systemd service, Kubernetes CronJob, or containerized worker task.
  - Trigger via external cron or system timers, synchronizing and auditing execution status through the persistent `scheduler_runs` and `scheduler_state` SQLite tables.

### 3. Robust Media Ingestion via Headless Browser Worker
- **Objective**: Harden social media and dynamic webpage scraping against aggressive anti-bot checkpoints and datacenter IP blocks.
- **Implementation**:
  - Replace fragile raw `curl` subprocess calls with a dedicated browser automation worker (e.g., Playwright / Puppeteer in an isolated container).
  - Support automatic session preservation, authenticated cookie vaults, full DOM hydration, and client-side JavaScript rendering for Instagram reels, carousels, and complex interactive web applications.