# Gate and prepare the cleanup issue #1558

Update #1558 so its dependency list names the Phase 2 sub-issue numbers instead of "all
implementation issues". Before it runs, check that each spec page's knowledge has a permanent home:

- access rules → `docs/agents/access-control/staff-copy.md` (already written by #1551);
- `Upload` copy origin and proxy link handler → the upload/proxy architecture docs;
- page and frontend structure → the frontend docs;
- cache clearing → the cache docs.

#1558 then deletes `docs/agents/specs/game-content-copy.md`, the `game-content-copy/` folder and the
`docs/agents/specs.md` hub entry, without touching `AGENTS.md`. Closing #1558 completes the Epic.

## Files to Change
- `docs/agents/issues/1558-remove-the-game-content-copy-specs.md` — dependency list with the Phase 2 issue numbers and the pre-removal checklist
