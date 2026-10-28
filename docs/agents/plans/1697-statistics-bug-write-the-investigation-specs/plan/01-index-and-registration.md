# Index and hub registration

Create the spec entrypoint and register it, following `docs/agents/specs/loot-crawling.md`.

`docs/agents/specs/statistics-bug.md`:

- One-paragraph problem statement (a tracked visitor gets a new statistics `Session` while
  navigating, suspected on page refresh) and a link to Epic #1696.
- `## Aspect pages`: links to the eight pages (investigation plan, symptom, hypotheses, export
  endpoint, scripts, environments, privacy, findings).
- `## Sub-issues`: the single status table for the Epic — number (#1697–#1705), title, page(s),
  status (open / in progress / done). Aspect pages link back here instead of tracking status.
- A lifecycle note: the specs are removed by the fix work after the post-fix check, once durable
  knowledge has moved to `docs/agents/statistics.md` / the access-control docs.

Register it under *Active specs* in `docs/agents/specs.md` (not in `AGENTS.md`).

## Files to Change

- `docs/agents/specs/statistics-bug.md` — new index.
- `docs/agents/specs.md` — add `- [Statistics Bug](specs/statistics-bug.md)` under *Active specs*.
