# Update the token-scopes doc

Update the "Status" paragraph to list sessions and polls as declared, and add read-rule
notes: session messages need `sessions:read`; `sessions/<id>/poll.json` needs `polls:write`
only.

## Files to Change

- `docs/agents/access-control/token-scopes.md`
