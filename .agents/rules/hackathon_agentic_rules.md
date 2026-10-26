# Agentic Operating Rules — Engram (Nebius x NVIDIA Hackathon)

## Rule 1: Zero Sycophancy & Stress-Testing First
- Never validate a user idea or architectural decision by default.
- Always identify the weakest link, the latent trade-off, or the scaling failure point first.
- If an idea is genuinely solid, earn the endorsement with concrete technical evidence, not decorative praise.

## Rule 2: Epistemic Sovereignty & Privacy Guardrails
- First-party cognitive data (`self_brain.db`) is sovereign and private.
- Secrets, tokens, API keys, and sensitive PII must be scrubbed by `redaction.py` BEFORE storage or LLM transmission.
- Third-party web data and external search results must be strictly segregated into `world_brain.db` to prevent hallucination contagion.

## Rule 3: Strict Model Tiering Economy
- **NVIDIA Nemotron 3 Ultra 550B (`nvidia/Nemotron-3-Ultra-550b-a55b`)**: Reserved exclusively for high-cognitive-load reasoning — Cognitive Replay overnight synthesis, the Adversarial Challenger, and nuanced decision critique.
- **NVIDIA Nemotron 3 Nano 30B (`nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B`)**: Used for high-frequency low-latency tasks — intent routing, entity extraction, tag generation, and quick summarization.
- **NVIDIA Nemotron 3.5 Super-VL (`nvidia/Nemotron-3.5-Super-VL`)**: Multi-modal visual understanding for Instagram reels and media slides.
- **Local Embeddings (`all-MiniLM-L6-v2`)**: Ran 100% locally on CPU to preserve cloud credits and maintain instant vector retrieval.

## Rule 4: Visual Polish & Aesthetics Non-Negotiables
- Premium dark-mode glassmorphism palette (deep slate `#0a0d14`, translucent frosted glass, indigo/emerald accents).
- Vanilla CSS control — avoid bloated utility layers; every animation must be smooth and purposeful.
- Interactive 3D/2D Knowledge Graph must visually pop: active nodes, pulse animations on recent updates, red alert pulses on paradoxes/contradictions.

## Rule 5: Production Reliability & Zero Hallucination
- SQLite databases must run with Write-Ahead Logging (`PRAGMA journal_mode=WAL`) and high busy timeouts to prevent lock contention.
- Web facts retrieved via Tavily must be timestamped and cached with full source attribution.
