# ⚡ AntiTheca on Nebius Serverless AI Jobs

This directory provides the production-grade deployment manifests to run AntiTheca's **3:00 AM Autonomous Epistemic Sleep Engine** as an ephemeral batch job on **Nebius Serverless AI Jobs**.

---

## 🏗️ Architecture: Zero-Idle Cloud Consolidation

Rather than running a monolithic VM 24 hours a day just to execute a consolidation pass in the middle of the night, AntiTheca leverages Nebius Serverless to decouple real-time intake from overnight synthesis:

```
 Daytime (Continuous Intake)                     Nighttime 03:00 AM (Ephemeral Batch)
┌───────────────────────────────┐              ┌──────────────────────────────────────┐
│  Vercel Frontend (Next.js 16) │              │      Nebius Serverless Job           │
│              │                │              │  (Ephemeral CPU/GPU Container)       │
│              ▼                │              ├──────────────────────────────────────┤
│  FastAPI Brain Server         │              │ 1. Mounts Sovereign Vault Volume     │
│  - Instant reel ingestion     │──(Atoms)────▶│ 2. Runs Tavily 3-Query Grounding     │
│  - Zero-Sycophancy Radar      │              │ 3. Prompts Nemotron 3 Ultra 550B     │
│  - Interactive Graph View     │              │ 4. Commits Morning Briefing to Vault │
└───────────────────────────────┘              │ 5. Dispatches Webhooks & Terminates  │
                                               └──────────────────┬───────────────────┘
                                                                  │
                                                     (Zero Idle Cost After Exit)
```

---

## 🚀 Deployment Instructions

### 1. Build & Push Batch Container Image
```bash
docker build -f deploy/nebius_serverless/Dockerfile.job -t cr.nebius.ai/your-workspace/antitheca-sleep-worker:latest .
docker push cr.nebius.ai/your-workspace/antitheca-sleep-worker:latest
```

### 2. Apply the Serverless Job Manifest
```bash
nebius serverless job apply -f deploy/nebius_serverless/job_spec.yaml
```

### 3. Trigger an On-Demand Test Run
```bash
nebius serverless job run antitheca-sleep-replay-engine
```

