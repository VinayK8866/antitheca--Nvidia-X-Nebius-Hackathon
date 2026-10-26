# Engram — High-Leverage Hackathon Roadmap & Final Steps

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

### 3. Epistemic Architectural Drift Audit (`app/code_auditor.py`)
- **Static ADR Verification**: Scans repository files to detect code-level architectural drift from documented architectural decisions (ADRs).
- **Checks Enforced**:
  - `ADR 028`: Zero distributed microservices or Kafka message brokers in the monolith.
  - `ADR 031`: Strict isolation between first-party cognitive memory (`self_brain.db`) and external world data (`world_brain.db`).
  - `Data Sovereignty`: All external API tokens bound to environment variables with zero plaintext credentials.
- **Adversarial Radar Card**: Displays real-time 100% compliance badge and verified claims in the UI.

### 4. Khoj Architectural Adaptations (Beating 37k-Star Prior Art)
- **Bulk Local Folder / Vault Ingest (`backend/app/ingest.py` & `demo_vault/`)**:
  - Point Engram at any directory of Markdown notes, ADRs, or images (`POST /api/ingest/folder`).
  - Tested with 5 engineering notes & ADRs ingested simultaneously in 3 seconds.
- **Morning Dispatch Webhook (`backend/app/dispatcher.py`)**:
  - Automatically dispatches 03:00 AM executive sleep briefings to Discord, Slack, or Telegram with rich color-coded embeds.
  - UI control in Daily Briefing view with live status pill and test dispatching.
- **Multi-Query Tavily Deep Research (`backend/app/tavily_client.py`)**:
  - Decomposes claims into 3 orthogonal subqueries (benchmarks, counter-arguments, consensus).
  - Deduplicates sources and synthesizes empirical confidence score.
  - Dedicated "Deep Research" trigger in Console with multi-source card view.

---

## 🏆 Devpost Winning Submission Checklist

### A. Demo Video Script (≤ 3 Minutes — Strict Devpost Requirement)
- [x] **0:00 - 0:40 (The Problem & The Hook)**:
  - Show the familiar habit: Saving dozens of Instagram reels, AI tools, and system architecture advice that rot in bookmarks.
  - Show why standard RAG and sycophantic chatbots fail: they tell you what you want to hear instead of protecting your principles.
- [x] **0:40 - 1:20 (Cognitive Replay — Thinking While You Sleep)**:
  - Reveal the Morning Executive Briefing generated autonomously at 3:00 AM by `NVIDIA Nemotron 3 Ultra 550B`.
  - Highlight the autonomous sleep daemon running in the background and morning webhook dispatch.
- [x] **1:20 - 2:00 (Multimodal Vision, Vault Ingest & Adversarial Radar)**:
  - Ingest the demo vault or drop the *"20 Microservices"* reel slide into the Ingest Station.
  - Show `Nemotron 3.5 Super-VL` parsing the image and the Adversarial Radar instantly flagging the contradiction against ADR 028.
- [x] **2:00 - 2:35 (Epistemic Console, Deep Research & Proactive Arbitrage)**:
  - Ask: *"Should I split Engram into 20 microservices right now?"*
  - Show the zero-sycophancy answer citing ADR 028 and surfacing proactive arbitrage notes saved weeks prior.
  - Run Tavily Multi-Query Deep Research live on SQLite WAL performance.
- [x] **2:35 - 3:00 (Architecture, Nebius Compute, and Wrap-Up)**:
  - Show the Nebius Token Factory logs, dual-database sovereignty (`self_brain.db` vs `world_brain.db`), and Tavily verification.

### B. Repository & Packaging
- [ ] Root `README.md` with high-resolution architecture diagrams (Mermaid), setup guide, and MIT License.
- [ ] Clean Dockerfile / Compose file for 1-command startup.
- [ ] Devpost project write-up detailing Track alignment and technical depth (`DEVPOST_SUBMISSION.md`).