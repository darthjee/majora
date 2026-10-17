# Update the other agents' boundaries

Make the other agents send `client/` work to the new agent:

- `.claude/agents/crawler.md` and `.claude/agents/proxy.md`: add `client/` to the "Do NOT
  touch" lists, naming `client` as its owner.
- `.claude/agents/infra.md`: add `client/` to the "Do NOT touch" list (source owned by
  `client`), and say that `infra` still owns the client wiring outside it (the `majora_client`
  service, the `client*` Makefile targets, the client CI jobs, `scripts/bump_version.sh client`).
- `.claude/agents/frontend.md`: a one-line note that `frontend/assets/js/client/` stays with
  `frontend` and is unrelated to the top-level `client/` folder (owned by `client`).

## Files to Change

- `.claude/agents/crawler.md`: exclusion list.
- `.claude/agents/proxy.md`: exclusion list.
- `.claude/agents/infra.md`: exclusion list and client wiring note.
- `.claude/agents/frontend.md`: naming note.
