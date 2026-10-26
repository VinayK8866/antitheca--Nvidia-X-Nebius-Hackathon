<div align="center">

# 🧠 ENGRAM
### *The AI That Thinks About Your Knowledge While You Sleep*

**Autonomous Cognitive Consolidation • Zero-Sycophancy Epistemic Memory • Dual-Brain Sovereignty**

[![Nebius Token Factory](https://img.shields.io/badge/Compute-Nebius%20Token%20Factory-00E5FF?style=for-the-badge&logo=nvidia&logoColor=black)](https://tokenfactory.nebius.com)
[![NVIDIA Nemotron 3 Ultra](https://img.shields.io/badge/Reasoning-Nemotron%203%20Ultra%20550B-76B900?style=for-the-badge&logo=nvidia&logoColor=white)](https://build.nvidia.com)
[![NVIDIA Nemotron Super-VL](https://img.shields.io/badge/Vision-Nemotron%203.5%20Super--VL-76B900?style=for-the-badge&logo=nvidia&logoColor=white)](https://build.nvidia.com)
[![Tavily AI Search](https://img.shields.io/badge/Research-Tavily%20Deep%20Search-FF6B6B?style=for-the-badge)](https://tavily.com)
[![Architecture](https://img.shields.io/badge/Storage-Dual%20SQLite%20WAL%20Sovereign-4B5563?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

*Submission for the **Nebius x NVIDIA Global AI Hackathon (Personal AI Track + $3,000 Tavily Sponsor Prize)***

</div>

---

## 📌 Executive Summary

Every software engineer, researcher, and knowledge worker suffers from the **Bookmark Graveyard**: we save hundreds of Instagram reels, architecture slides, technical tweets, and Obsidian notes, but when making high-stakes decisions, we cannot recall them.

Worse, existing personal assistants are **dangerously sycophantic**:
> If you tell ChatGPT: *"I'm thinking of breaking my solo MVP into 20 microservices with Kafka,"*  
> It replies: *"Great idea! Here is a Kubernetes manifest..."*  
> Even if three weeks ago you wrote an Architecture Decision Record (ADR 028) swearing never to introduce distributed microservices!

**Engram solves this fundamentally through Neuroscience-Inspired Cognitive Consolidation:**
1. **Thinks While You Sleep**: An autonomous background daemon fires every night at 3:00 AM, cross-referencing your bookmarks, building topological bridges in your knowledge graph, verifying ungrounded claims via Tavily, and preparing your morning briefing with **NVIDIA Nemotron 3 Ultra 550B**.
2. **Zero-Sycophancy Adversarial Radar**: Engram refuses to be a "yes-man". When you feed it a hyped reel or query, it actively searches for contradictions against your past ADRs and empirical benchmarks.
3. **Dual-Brain Sovereignty**: Strict mathematical isolation between what *you* believe (`self_brain.db`) and what the *world* claims (`world_brain.db`), audited continuously by static code drift detectors.

---

## 🏗️ System Architecture

### 1. Dual-Brain Sovereignty & Epistemic Boundary
Engram strictly prevents external internet hallucinations and hyped social media claims from contaminating your personal conviction:

```mermaid
flowchart TD
    subgraph INGESTION ["📥 Multi-Modal Ingest Pipeline"]
        A1["Instagram Reel / Slide"] -->|NVIDIA Nemotron 3.5 Super-VL| OCR["Visual OCR & Concept Extraction"]
        A2["Obsidian Vault / ADRs"] -->|Bulk Markdown Parser| MD["Chunker & Metadata Extractor"]
        A3["Tech URLs & Tweets"] -->|Scraper| WEB["Web Article Parser"]
    end

    subgraph ISOLATION ["🛡️ Epistemic Dual-Brain Storage (SQLite WAL)"]
        OCR -->|Contradiction Analysis| ADV{"Adversarial Cross-Check"}
        MD -->|First-Party Convictions| S_DB[("self_brain.db<br/>(Personal ADRs, Principles, Decisions)")]
        WEB -->|External Hypotheses| W_DB[("world_brain.db<br/>(Empirical Facts, Benchmarks, Citations)")]
        ADV -->|Tension Detected| RADAR["🚨 Adversarial Radar (High/Med Severities)"]
    end

    subgraph AUTONOMOUS_LOOP ["🌙 03:00 AM Autonomous Sleep Consolidation"]
        CRON["Background Cron Loop (03:00 AM)"] --> HARVEST["Harvest Unconsolidated Atoms"]
        HARVEST --> TAVILY["Tavily Multi-Query Deep Research<br/>(Benchmarks, Counter-Arguments, Consensus)"]
        TAVILY --> SYNTH["NVIDIA Nemotron 3 Ultra 550B<br/>(Epistemic Executive Synthesis)"]
        SYNTH --> BRIEFING["📋 Daily Executive Briefing"]
        BRIEFING --> DISPATCH["📡 Morning Dispatch Webhook<br/>(Discord / Slack / Telegram)"]
    end

    subgraph CONSOLE ["💬 Epistemic Cognitive Console"]
        USER["Developer / Founder"] -->|Prompt / Assumption| CHAT["Zero-Sycophancy Query Engine"]
        CHAT -->|Ground Truth RAG| S_DB
        CHAT -->|Empirical Citations| W_DB
        CHAT -->|Adversarial Rebuttal| USER
    end
```

---

## ⚡ Dynamic NVIDIA Compute Tiering on Nebius Token Factory

Engram allocates compute dynamically across specialized NVIDIA models hosted on high-throughput Nebius H100/H200 clusters:

| Model ID | Nebius Role | Why This Model? |
| :--- | :--- | :--- |
| `nvidia/Nemotron-3-Ultra-550b-a55b` | **Sleep Replay & Adversarial Arbiter** | Massive 550B parameter parameterization provides the deep reasoning required to uncover non-obvious contradictions across dozens of technical documents. |
| `nvidia/Nemotron-3.5-Super-VL` | **Multimodal Slide & Reel Extraction** | High-resolution vision parser that reads architectural flowcharts, meme graphics, and text overlays from saved video keyframes. |
| `nvidia/Nemotron-Mini-4B-Instruct` | **Real-Time Edge Ingest & Tokenization** | Ultra-low latency edge classifier for instant chunk tagging, entity disambiguation, and ADR metadata classification. |
| `tavily-ai-search` | **Empirical Web Verification** | Real-time multi-query grounding engine providing empirical benchmark citations directly to the dual-brain memory. |

---

## 🎯 Key Innovations & Capabilities

### 1. Autonomous 3:00 AM Sleep Engine (`app/scheduler.py`)
Human memory does not consolidate during intake; it consolidates during sleep replay (Sharp Waves & Ripples in the hippocampus). Engram mirrors this:
- An `asyncio` background daemon tracks time until 03:00 AM.
- It wakes up in the dark, traverses newly ingested graph clusters, identifies topological holes, queries Tavily for external grounding, and executes a full consolidation cycle with Nemotron 3 Ultra 550B.
- Automatically dispatches the briefing to your team's Discord/Slack webhook before you wake up.

### 2. Multi-Query Tavily Deep Research Loop (`app/tavily_client.py`)
*Direct contender for the $3,000 Tavily Sponsor Prize.*  
Rather than naive single-shot web search, Engram decomposes complex claims into **3 orthogonal queries**:
1. **Empirical Benchmarks** (`"empirical benchmark comparison ..."`)
2. **Failure Modes & Counter-Arguments** (`"drawbacks failure modes and bottlenecks of ..."`)
3. **Consensus Best Practices** (`"consensus production experience with ..."`)
Engram queries Tavily in parallel, deduplicates sources, computes an empirical confidence score (0-100%), and writes verified facts into `world_brain.db`.

### 3. Bulk Obsidian Vault & Local Folder Ingest (`app/ingest.py`)
- Adapts and surpasses the best feature of Khoj (37k+ stars).
- Point Engram at any directory of Markdown files, ADRs, or PDFs:
  ```bash
  curl -X POST http://localhost:8000/api/ingest/folder \
    -H "Content-Type: application/json" \
    -d '{"folder_path": "/absolute/path/to/your/notes"}'
  ```
- Recursively parses frontmatter, categorizes ADRs vs notes, generates embeddings, and indexes the entire vault into the graph in seconds.

### 4. Zero-Sycophancy Adversarial Radar (`app/adversarial.py`)
- Real-time detection of cognitive tension.
- When an ingested note contradicts an existing ADR (e.g. *SQLite Monolith vs 20 Microservices*), Engram flags it with high severity and creates an actionable challenge requiring developer sign-off to resolve.

### 5. Static Epistemic Code Drift Auditor (`app/code_auditor.py`)
- An automated static analysis engine that reads your codebase and verifies that your actual code complies with your ADRs:
  - Verifies **ADR 028** (Zero distributed message brokers / microservice sprawl).
  - Verifies **ADR 031** (Strict file-level boundary between `self_brain.db` and `world_brain.db`).
  - Verifies **Data Sovereignty** (No plaintext secrets or leaked keys).

### 6. Obsidian LLM Wiki Standard & Vault Health Linter (`app/code_auditor.py` & `app/replay_engine.py`)
- **Native Obsidian `[[Wikilinks]]`**: Notes and sleep briefings use standard bidirectional `[[wikilink]]` syntax, making the entire knowledge base natively navigable in Obsidian Graph View and Canvas.
- **Autonomous `Map_of_Content.md` (MOC)**: Generated automatically during the 03:00 AM sleep replay cycle, organizing your vault into Architecture Decisions (ADRs), Engineering Principles, Active Contradictions, and Empirical Benchmarks.
- **Epistemic Vault Health Linter (`wiki-lint`)**: Scans for broken wikilinks, orphan thoughts (notes with 0 connections), and empty stubs to keep your knowledge graph clean and compounding over time.

### 7. Native PARA Architecture & Dynamic Vault Map (`Meta/vault-map.md`)
- Adheres to the established **PARA (Projects, Areas, Resources, Archive)** knowledge organization standard.
- Reads `Meta/vault-map.md` to dynamically route knowledge atoms:
  - `00-Inbox/`: Unprocessed brain dumps, transcripts, and mobile captures pending sleep replay.
  - `01-Projects/`: Active milestones and engineering deliverables.
  - `02-Areas/`: Long-term responsibilities, principles, and active ADRs.
  - `03-Resources/`: Technical whitepapers, benchmarks, and external cheatsheets.
  - `04-Archive/`: Superceded ADRs, completed sprints, and decayed knowledge.

### 8. Temporal Commitment & Deadline Radar (`app/temporal_radar.py`)
- Automatically parses messy brain dumps, meeting notes, and voice transcripts for hidden deliverables and deadlines (e.g. *"submit video by Thursday 5pm"*, *"follow up with Alex before sprint review"*).
- Extracts urgency level, deadline timeframe, and source note link.
- Injects critical upcoming deadlines directly into your morning Discord/Slack webhook dispatch and the Adversarial Radar UI.

### 9. 5-Phase Cognitive Defrag & Tag Garden Hygiene (`app/code_auditor.py`)
- **Tag Garden Audit**: Identifies orphan tags (used only once) and suggests merges for near-duplicate taxonomy terms (e.g. `#infrastructure` → `#infra`).
- **Knowledge Decay Detection**: Detects stale notes with zero incoming links and flags them as archival candidates for `04-Archive/`.
- **Structural Defrag Report**: Generates an actionable hygiene markdown audit during the 3:00 AM sleep replay or on-demand.

---

## 🚀 Quickstart Guide

### Option A: Docker Compose (1-Command Startup)
```bash
# 1. Clone repository
git clone https://github.com/your-username/engram.git
cd engram

# 2. Configure environment
cp .env.example .env
# Edit .env with your NEBIUS_API_KEY and TAVILY_API_KEY

# 3. Start Engram (Backend + Frontend)
docker compose up --build
```
Open **`http://localhost:3000`** in your browser.

---

### Option B: Local Development
```bash
# 1. Clone & Enter
git clone https://github.com/your-username/engram.git
cd engram

# 2. Configure keys
cp .env.example backend/.env
# Add your NEBIUS_API_KEY and TAVILY_API_KEY in backend/.env

# 3. Launch via 1-click script
./start.sh
```
- **Web App**: `http://localhost:3000`
- **FastAPI OpenAPI Docs**: `http://localhost:8000/docs`

---

## 🧪 Testing with the Built-in Demo Vault

Engram comes pre-packaged with a realistic engineering vault (`backend/demo_vault/`):
- `ADR_045_State_Management.md`: Rejection of Redis in favor of SQLite WAL for single-node efficiency.
- `ADR_052_Compute_Tiering.md`: Tiered orchestration across NVIDIA Nemotron models.
- `PostgreSQL_vs_SQLite_Debate.md`: Deep comparison of operational complexity.
- `Microservices_Anti_Pattern_Notes.md`: Real-world postmortems on microservice bloat.
- `Autonomous_Agent_Memory_Loops.md`: Cognitive replay loop design patterns.

**To ingest the sample vault:**
1. Open the Engram Console at `http://localhost:3000/?tab=console`.
2. Click the **"Vault Bulk"** tab.
3. Click **"Load Sample Engineering Vault (5 Notes & ADRs)"** -> Ingest into Brain.
4. Watch the Knowledge Graph and Adversarial Radar illuminate instantly!

---

## 📊 Live Interactive Endpoints

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/replay/latest` | `GET` | Retrieve the latest overnight executive briefing generated by Nemotron 3 Ultra 550B. |
| `/api/replay/schedule/trigger` | `POST` | Simulate the 03:00 AM autonomous cron sleep consolidation cycle. |
| `/api/dispatch/test` | `POST` | Dispatch the briefing to a custom Discord/Slack/Telegram webhook. |
| `/api/research/deep` | `POST` | Run 3-query Tavily Deep Research on any claim or technical topic. |
| `/api/ingest/folder` | `POST` | Recursively ingest an entire Obsidian vault or local folder. |
| `/api/ingest/file` | `POST` | Multimodal OCR and concept extraction from images using `Nemotron-3.5-Super-VL`. |
| `/api/audit/code` | `GET` | Run static code auditor to verify compliance with documented ADRs. |
| `/api/challenges` | `GET` | Retrieve active adversarial challenges and epistemic contradictions. |
| `/api/query` | `POST` | Zero-sycophancy query console with ground-truth RAG and proactive citations. |

---

## 🏆 Hackathon Alignment & Track Checklist

- [x] **Primary Track: Personal AI**: Solves personal knowledge retention, bookmark overload, and cognitive drift with zero-sycophancy memory.
- [x] **Nebius Token Factory Integration**: High-throughput orchestration across `nvidia/Nemotron-3-Ultra-550b-a55b` and `nvidia/Nemotron-3.5-Super-VL`.
- [x] **Tavily Sponsor Prize Candidate**: Implemented orthogonal 3-query Deep Research loop with source deduplication and confidence scoring.
- [x] **Open Source Sovereignty**: 100% MIT License, local-first SQLite WAL dual-database storage, zero proprietary cloud lock-in.

---

## 📄 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
