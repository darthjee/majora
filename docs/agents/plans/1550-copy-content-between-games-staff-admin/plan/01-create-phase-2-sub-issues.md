# Create the Phase 2 sub-issues

Create one GitHub sub-issue of #1550 per row of the Epic's Phase 2 table (A–J), with
`/arcanum-split-issue 1550`. Each body:

- states its goal in one or two sentences and names the spec pages it implements (e.g.
  `docs/agents/specs/game-content-copy/hard-links.md` for B), without copying their content;
- lists the agents involved (backend, proxy, frontend, translator) and the reviewers to run
  (`data-access`, `security` for new endpoints; `cache` check for Navi);
- lists its dependencies on the other sub-issues;
- requires the PR to update the spec page if the implementation departs from it.

Suggested titles:

| Row | Title |
|---|---|
| A | Game content copy: backend foundation (`copied_from`, staff copies index and games) |
| B | Game content copy: `Upload` copy origin (link uploads, failure, renew, cleanup) |
| C | Game content copy: proxy hard-link handler |
| D | Game content copy: frontend page shell (Admin menu, selectors, tabs, progress) |
| E | Game content copy: Items tab |
| F | Game content copy: Common items tab |
| G | Game content copy: Recipes tab |
| H | Game content copy: Possessions tab |
| I | Game content copy: Factions tab |
| J | Game content copy: Documents tab |

Labels: `Feature` on every sub-issue (no `Epic`).

## Files to Change
- `docs/agents/issues/<id>-<slug>.md` — one local draft per sub-issue, produced by the split skill
