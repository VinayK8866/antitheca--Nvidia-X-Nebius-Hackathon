# ADR 045: Single-Node SQLite WAL State Management

## Status: ACCEPTED
## Date: 2026-10-15

## Context
When architecting AntiTheca, external tutorials suggested deploying Redis Sentinel and PostgreSQL for distributed state cache.

## Decision
We strictly reject distributed in-memory caches. We use SQLite in WAL mode with a single writer thread and multi-threaded readers.

## Consequences
- Zero external broker latency or cloud hosting cost.
- ACID compliance with 100k+ reads/sec on NVMe.
- Hard constraint: Do not introduce distributed key-value brokers.

## Related Notes
- [[PostgreSQL_vs_SQLite_Debate]]
- [[Autonomous_Agent_Memory_Loops]]

