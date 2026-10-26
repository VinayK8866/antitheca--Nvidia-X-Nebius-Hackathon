# ADR 052: Model Compute Tiering on Nebius

## Status: ACCEPTED
## Date: 2026-10-18

## Context
Running 550B MoE models on every simple classification or tag extraction exhausts GPU credits within hours.

## Decision
We enforce dynamic compute tiering:
1. Classification & routing -> NVIDIA Nemotron Nano 30B
2. Slide OCR & Vision -> Nemotron 3.5 Super-VL
3. Overnight Replay & Adversarial Challenger -> Nemotron 3 Ultra 550B
4. Embeddings -> Local MiniLM on CPU

## Consequences
Reduces inference cost by 92% while maintaining enterprise-grade reasoning depth where it matters.
