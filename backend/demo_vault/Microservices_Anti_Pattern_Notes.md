# Microservices Anti-Pattern for Small Teams

Notes on Conway's Law and distributed systems.

- Microservices model organizational boundaries, not code modularity.
- When a 1-person or 2-person team splits into 20 microservices, every change requires coordinated API contracts, network hops, and tracing.
- Monolith first, modularize with code packages, only split when independent deployment velocity demands it.

## Related Decisions
- [[ADR_045_State_Management]]
- [[ADR_052_Compute_Tiering]]

