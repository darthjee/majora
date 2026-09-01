# Refresh vendored navi docs

Replace majora's vendored copies of navi's own guides wholesale with the current
upstream content matching the 1.9.0/0.2.0 bump. These are pure vendored copies
with no majora-specific edits to preserve, so no diff/review pass is needed —
straight replacement, plus fixing the one casing mismatch between upstream's
`how_to_use_navi.md` filename and majora's existing `HOW_TO_USE_NAVI.md`.

**Status: done**, committed on this branch (`e02cd9d2`); every internal relative
link across the replaced files was verified to resolve to a real file.

## Files to Change

- `docs/agents/external/HOW_TO_USE_NAVI.md` — replaced with upstream
  `docs/guides/how_to_use_navi.md` content (filename kept as-is to match every
  other majora doc that links to it).
- `docs/agents/external/HOW_TO_USE_NAVI-CLIENT.md` — replaced with upstream
  `docs/guides/HOW_TO_USE_NAVI-CLIENT.md` content (direct copy, filename already
  matches).
- `docs/agents/external/navi/` — replaced wholesale with upstream
  `docs/guides/navi/`, picking up the new `option-d-hosted-server.md`,
  `emit-configuration.md`, `samples.md`, and `samples/*.md`; every
  `../how_to_use_navi.md` back-link fixed to `../HOW_TO_USE_NAVI.md`.
- `docs/agents/external/navi-client/` — replaced wholesale with upstream
  `docs/guides/navi-client/`, picking up the new `samples.md` and `samples/*.md`.
