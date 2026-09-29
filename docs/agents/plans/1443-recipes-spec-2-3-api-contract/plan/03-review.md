# Data-access and security review
Dispatch the `data-access` and `security` agents (both read-only) on the written contract and the
diff, asking them to check it against `docs/agents/access-control/principles.md` and
`docs/agents/security-guidelines.md`. Particular points to check:
- the output masking, including on write responses and in the category filter;
- the hidden-output `400` on writes;
- `X-Skip-Cache` on every restricted variant;
- the hidden-NPC gate ordering;
- that recipe → characters can't leak hidden or incognito NPCs;
- that PATCH `hidden` can't be reached by a non-editor.

Address each finding by editing the contract (or the domain pages), and record any finding that's
deliberately not adopted, with the reason, in the PR description.

## Files to Change
- `docs/agents/specs/recipes/api-contract.md` — apply the review findings.
