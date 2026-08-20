# Product Definitions and the Product Owner Agent

Product-level concepts — entity definitions, ownership chain, GameMaster role, and editing rules — are documented in `docs/agents/product.md`. This is the single source of truth for domain semantics, independent of ORM details.

The product-owner agent (`.claude/agents/product-owner.md`) is a read-only agent whose primary reference is `docs/agents/product.md`. The architect invokes it before planning any issue that:

- Introduces a new entity or endpoint.
- Changes access rules or ownership logic.
- Requires understanding who can see or edit what.

When `docs/agents/product.md` is updated, update `docs/agents/access-control.md` in the same PR.
