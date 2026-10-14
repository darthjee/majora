# Hub page and registration

Create `docs/agents/specs/client.md`, the entry point for the client spec. Contents:

- A short intro: the purpose (a Node.js client in the new top-level `client/` folder, so
  automations such as an AI content generator can use the API through fine-grained, scoped
  tokens) and a link to epic #1592.
- In scope and out of scope, from the epic:
  - out: `crawler/` and the legacy DRF `Token` (unchanged), concrete automations, full API
    coverage;
  - a note that `client/` is unrelated to `frontend/assets/js/client/`.
- `## Aspect pages`: links to the seven pages, each with a one-line summary.
- `## Sub-issues`: a table mapping #1593–#1613 to their aspect pages and owning agents, plus the
  order they run in (spec, then improvements, then the agent; the backend track (10 → 11 → 12),
  then frontend (13, 14); the client track (15 → 16 → 17/18, then 19); docs, then removal).
- A note that this spec is removed by #1613, once #1612 has moved its content into the
  permanent docs.

Then add `- [Client](specs/client.md)` under "Active specs" in `docs/agents/specs.md`.

## Files to Change

- `docs/agents/specs/client.md`: new hub page.
- `docs/agents/specs.md`: register the spec under "Active specs".
