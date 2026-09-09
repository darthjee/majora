# Issue: Record verified Lootstudios `GetMyLootsCache` auth requirement and pagination findings

## Description

Surfaced while discussing #1263 (Crawler — Navi configuration to extract and
import Lootstudios models). Sub-issue of the parent tracking issue #1260.

`docs/agents/specs/loot-crawling/source-to-collections.md` (written during
#1265's exploration pass) flagged two open questions about
`GET /wp-admin/admin-ajax.php?action=GetMyLootsCache` — Lootstudios' catalog
endpoint — that its own author could not resolve without a real, logged-in
Lootstudios account:

1. **Does the endpoint actually require auth?** It was observed responding
   with no explicit auth header/cookie, despite its name ("**My** Loots")
   implying account-scoped data.
2. **Does the response paginate?** Scrolling `/my-loots/` in a browser
   triggers additional network activity, which may just be front-end
   virtualization over a single complete response, or may indicate the
   `GetMyLootsCache` call itself is paginated/incomplete.

Both questions turned out not to need a live account after all — a clean,
cookie-less request to the endpoint is enough to observe the answer directly
(see Findings below). #1263 (the Navi configuration) currently assumes **no
auth is strictly required** and **no pagination** (a single
`GetMyLootsCache` call returns the full catalog); this issue exists to
record the now-verified answers back into `source-to-collections.md`.

This is a documentation task, not an implementation task — no code changes
are expected as output, just the findings written back into
`source-to-collections.md`.

## Findings (verified 2026-09-09)

### Auth requirement — resolved: not required

Confirmed with a clean request carrying no cookies/session at all:

```bash
curl -s 'https://app.lootstudios.com/wp-admin/admin-ajax.php?action=GetMyLootsCache'
```

The response came back `HTTP 200` with a full catalog payload — 398
`bundleObjs` entries and 4967 `miniatureObjs` entries — despite zero auth
headers/cookies being sent. Every returned bundle's `ft_ownership` field was
`"false"`, confirming this is the general public catalog rather than
account-scoped "my loots" data; the endpoint's name is misleading.
**#1263's assumption (no auth strictly required) is confirmed correct.**

### Pagination — resolved: none

The single response's top level has exactly two keys — `bundleObjs` and
`miniatureObjs` — with no `page`/`cursor`/`total` metadata anywhere, and it
already contained the full catalog (398 bundles) in that one call.
**#1263's assumption (a single call returns the full catalog) is confirmed
correct.**

## Explicitly out of scope

- Any code changes to #1263's Navi config or the backend import endpoints —
  both of its relevant assumptions are confirmed correct by the findings
  above, so no correction is needed there.
- Re-verifying anything else already settled in the `loot-crawling` spec
  pages (field mappings, the `GetMyLootsCache` response shape itself, the
  emission payload contract) — those are already confirmed, not open
  questions.

## Testing strategy

N/A — documentation task. "Testing" here was the live curl check recorded
under Findings above.

## Acceptance criteria

- [ ] `docs/agents/specs/loot-crawling/source-to-collections.md`'s "Open
      question 1" (auth) is updated to record: not required — confirmed via
      a live, cookie-less `GetMyLootsCache` call returning full catalog
      data — and marked resolved.
- [ ] The same page's "Open question 2" (pagination) is updated to record:
      none — a single call returns the full catalog, no pagination
      metadata present — and marked resolved.
- [ ] No follow-up issue against #1263 is needed: both of its relevant
      assumptions are confirmed correct.

Owned by: `crawler` (documentation-only, same as #1261 — no backend/frontend
code expected).
