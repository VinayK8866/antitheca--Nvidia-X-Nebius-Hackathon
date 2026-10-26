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

---

## 🏆 Devpost Winning Submission Checklist

### A. Demo Video Script (≤ 3 Minutes — Strict Devpost Requirement)
- [ ] **0:00 - 0:40 (The Problem & The Hook)**:
  - Show the familiar habit: Saving dozens of Instagram reels, AI tools, and system architecture advice that rot in bookmarks.
  - Show why standard RAG and sycophantic chatbots fail: they tell you what you want to hear instead of protecting your principles.
- [ ] **0:40 - 1:20 (Cognitive Replay — Thinking While You Sleep)**:
  - Reveal the Morning Executive Briefing generated autonomously at 3:00 AM by `NVIDIA Nemotron 3 Ultra 550B`.
  - Highlight the autonomous sleep daemon running in the background.
- [ ] **1:20 - 2:00 (Multimodal Vision & Adversarial Radar)**:
  - Drop the *"20 Microservices"* reel slide into the Ingest Station.
  - Show `Nemotron 3.5 Super-VL` parsing the image and the Adversarial Radar instantly flagging the contradiction against ADR 028.
- [ ] **2:00 - 2:35 (Epistemic Console & Proactive Arbitrage)**:
  - Ask: *"Should I split Engram into 20 microservices right now?"*
  - Show the zero-sycophancy answer citing ADR 028 and surfacing proactive arbitrage notes saved weeks prior.
- [ ] **2:35 - 3:00 (Architecture, Nebius Compute, and Wrap-Up)**:
  - Show the Nebius Token Factory logs, dual-database sovereignty (`self_brain.db` vs `world_brain.db`), and Tavily verification.

### B. Repository & Packaging
- [ ] Root `README.md` with high-resolution architecture diagrams (Mermaid), setup guide, and MIT License.
- [ ] Clean Dockerfile / Compose file for 1-command startup.
- [ ] Devpost project write-up detailing Track alignment and technical depth.