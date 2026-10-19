# Move pending wrapper designs into their issues

The design for the still-open wrapper issues exists only in the spec's `library.md`
("Resource wrappers", "First resource set", "Game-bound accessor", "Actions", "Regular and
restricted variants") and in `scopes.md` ("Write scopes and link routes", "Uploads").

For each of #1621 (document pages), #1622 (link routes) and #1623 (photo uploads):

1. Read the current issue body (`gh issue view <id> --repo darthjee/majora`).
2. Append a "Design" section with the parts of the spec that apply to that issue: method
   names, endpoints, payloads, scope requirements, errors and tests. Replace links into
   `docs/agents/specs/client/` with links to the new permanent pages
   (`docs/agents/client/library.md`, `docs/agents/access-control/token-scopes.md`).
3. Add an instruction that, when it lands, the issue updates `docs/agents/client/library.md`,
   `client/README.md` and the consumer guide.
4. Update the body with `gh issue edit <id> --repo darthjee/majora --body-file <file>`, using
   a scratch file outside the repo.

Mention the three updates in the PR description.

## Files to Change

- None in the repo. GitHub issues #1621, #1622 and #1623 are edited.
