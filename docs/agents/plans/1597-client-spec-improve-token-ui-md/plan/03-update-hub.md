# Update the client hub

Update `docs/agents/specs/client.md` so the overview reflects this refinement.

- **Aspect pages:** extend the Token UI line to mention the staff panel and the `RequestStore`
  data access, and the Token API line to mention `options.json` (scope catalogue and reachable
  games).
- **Order:** in step 2 of `### Order`, change "The frontend issues #1605 and #1606 need #1604"
  to say #1605 needs #1604, and #1606 needs both #1604 and #1605 (it reuses the shared
  `ApiTokenRevokeConfirmModal` and token row cells).
- Add a one-line note that #1597 also amended `token-api.md` (reachable-game definition,
  `options.json`), so readers of #1604 know where the change came from.

## Files to Change

- `docs/agents/specs/client.md` — aspect-page lines, Order, amendment note.
