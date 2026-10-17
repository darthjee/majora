# Record the interim fail-closed in the spec

Update `docs/agents/specs/client/tokens.md` so it matches what #1602 ships: under
**Authentication** (and the **Testing strategy** list), note that until #1603 adds the scope check,
every Bearer request that authenticates is refused with 403 `token_not_allowed`, and that
`last_used_at` is still updated. State that #1603 replaces this blanket refusal at the same point.
Keep the wording short and plain; run markdownlint.

## Files to Change

- `docs/agents/specs/client/tokens.md` — interim fail-closed note.
