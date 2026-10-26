---
name: engram-evaluator
description: Comprehensive test, validation, and benchmarking skill for Engram during the Nebius x NVIDIA Hackathon.
---

# Engram Evaluator Skill

Use this skill to inspect system health, verify live inference with Nebius Token Factory and NVIDIA Nemotron models, test Tavily search caching, execute full-loop Cognitive Replay runs, and validate Devpost submission readiness.

## 1. Quick Verification Commands

### Test Live Nebius & Tavily APIs:
```bash
/home/user/Private_View/Vinay/personal-ai-second-brain/venv/bin/python -c "
from app.llm_client import llm_client
from app.tavily_client import tavily_client

print('Nebius Live:', llm_client.is_live, '| Model:', llm_client.reasoning_model)
print('Tavily Live:', tavily_client.is_live)
"
```

### Run End-to-End Test Suite:
```bash
/home/user/Private_View/Vinay/personal-ai-second-brain/venv/bin/python backend/tests/test_pipeline.py
```

### Launch FastAPI Server:
```bash
cd backend && /home/user/Private_View/Vinay/personal-ai-second-brain/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## 2. Devpost Submission Checklist
- [ ] Working demo hosted on Nebius AI Cloud / Vercel.
- [ ] 3-minute video showing:
  - Instagram reel / note ingestion.
  - Cognitive Replay overnight simulation with morning briefing.
  - Adversarial Challenger highlighting a contradiction in red on the 3D graph.
  - Live Token Factory logs showing Nemotron 3 Ultra and Nano inference.
- [ ] Public GitHub repository with MIT License and thorough README.
- [ ] Written feedback on Nebius Token Factory and NVIDIA models.
