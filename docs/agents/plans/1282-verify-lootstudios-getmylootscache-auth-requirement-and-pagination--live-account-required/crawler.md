# Crawler Plan: Record verified Lootstudios `GetMyLootsCache` auth requirement and pagination findings

Main plan: [plan.md](plan.md)

## Implementation Steps

### Step 1 — Resolve both open questions in `source-to-collections.md`

Update `docs/agents/specs/loot-crawling/source-to-collections.md` with the
findings already verified live (recorded in issue #1282's "Findings"
section):

- **Open question 1 (auth)**: a clean, cookie-less request to
  `GET /wp-admin/admin-ajax.php?action=GetMyLootsCache` returned `HTTP 200`
  with a full catalog payload (398 `bundleObjs`, 4967 `miniatureObjs`).
  Every returned bundle's `ft_ownership` field was `"false"`, confirming the
  endpoint is the general public catalog, not account-scoped "my loots"
  data — the name is misleading. Replace the "Status: open — needs live
  verification" line with the resolved answer: no auth required, endpoint is
  public/unscoped.
- **Open question 2 (pagination)**: the same response's top level has
  exactly two keys (`bundleObjs`, `miniatureObjs`), no `page`/`cursor`/
  `total` metadata, and already contains the full 398-bundle catalog in one
  call. Replace the "Status: open — needs live verification" line with the
  resolved answer: no pagination, a single call returns everything.

Keep each section's existing structure (heading, explanation paragraph) —
only replace the "Status: open — needs live verification" line and exact
test description with the resolved status and observed result, so the page
still reads as a coherent spec rather than a raw findings dump.

## Files to Change

- `docs/agents/specs/loot-crawling/source-to-collections.md` — resolve
  "Open question 1" (auth) and "Open question 2" (pagination) with the
  verified findings above.

## Notes

- No code changes anywhere — this is a documentation-only update, per issue
  #1282's explicit scope.
- No follow-up issue against #1263 is needed: both of its assumptions (no
  auth strictly required, no pagination) are confirmed correct by these
  findings.
