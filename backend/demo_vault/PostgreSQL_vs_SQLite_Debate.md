# Empirical Notes: Database Selection for Solo Founders

Saved reflection on database overhead.

- Managed Postgres costs $35+/month before you write a single line of business logic.
- Connection pooling, connection leaks, and VPC networking introduce unnecessary failure points for a personal AI.
- SQLite WAL mode embedded in FastAPI handles 4GB+ with sub-millisecond retrieval.
- "You aren't Google, stop running Google's stack."

## Related Decisions
- [[ADR_045_State_Management]]
- [[Microservices_Anti_Pattern_Notes]]

