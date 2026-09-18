# Plan: Docs: reword 15 line-wrapped #issue references under docs/agents/specs/ so they stop tripping Codacy's markdownlint MD018

Issue: [1361-writting-add-missing-space-after-in-15-atx-style-markdown-headings-under-docs-agents-specs.md](../issues/1361-writting-add-missing-space-after-in-15-atx-style-markdown-headings-under-docs-agents-specs.md)

## Overview

Codacy's markdownlint `MD018` check flags 15 lines as malformed atx headings, but none of them are actual headings — each is a hard-wrapped prose paragraph where a GitHub issue reference like `#1262` happens to land as the first token on a line. This plan rewords those 15 spots so the reference no longer starts a line (never adds a space after `#`, which would create a real spurious heading instead), and separately hardens the repo's markdownlint config so this false-positive pattern stops recurring on future doc edits.

## Context

`.markdownlint-cli2.jsonc` (used by the CI `markdownlint` job via `yarn lint_md`) currently has `default: false` and only enables `MD012`, `MD022`, `MD032` — `MD018` is not enabled there. Since Codacy is nonetheless reporting `MD018` findings, Codacy's scan is evidently not governed by this file; the config that actually needs updating must be identified during implementation (see Step 2).

## Implementation Steps

### Step 1 — Reword the 15 flagged lines

For each location below, edit the surrounding sentence so the `#NNNN` reference is no longer the first token on its line — move a preceding word down, or restructure the sentence — while preserving meaning and matching the existing hard-wrap width of the paragraph (visually inspect neighboring lines in each file; there is no repo-wide documented wrap-column, but paragraphs are consistently hand-wrapped well under 100 characters). Do not add a space after `#`.

- `docs/agents/specs/loot-crawling/interactive-collection-enqueue.md:5, :16, :245, :312`
- `docs/agents/specs/loot-crawling/emission-endpoint.md:115, :116, :124`
- `docs/agents/specs/loot-crawling/source-to-collections.md:27`
- `docs/agents/product/entities/game-item.md:9`
- `docs/agents/specs/loot-crawling/collection-to-stl-models.md:12, :83, :153`
- `docs/agents/specs/loot-crawling/model-changes.md:32`
- `docs/agents/specs/crawler-test-harness.md:11, :143`

After editing, re-check each touched file for any *new* line that now starts with `#NNNN` as a side effect of the rewrap (shifting words between lines can push a different reference to a new line start) — iterate until none remain.

### Step 2 — Disable MD018 wherever Codacy's scan actually reads it, to prevent recurrence

Since `.markdownlint-cli2.jsonc` already excludes `MD018` (via `default: false` and its absence from the enabled list) yet Codacy still reports it, that file is not Codacy's source of truth for this rule. Investigate where Codacy's markdownlint engine gets its rule config for this repo (e.g. Codacy's per-repo pattern settings, or a Codacy-specific config file/section it does read) and disable `MD018` there repo-wide. `.codacy.yml` (root of the repo) is the most likely place if Codacy exposes a markdownlint engine key there (it currently only configures `duplication`, `bandit`, `phpmd`, `phpcs` engines) — add a markdownlint engine entry disabling `MD018` if the Codacy engine schema supports it; otherwise use Codacy's repository settings UI/API for pattern configuration and note in the PR description that it was done outside the repo (since that isn't a file change reviewable in the diff).

If, after investigation, `MD018` turns out to already be correctly disabled for Codacy's scan through some mechanism not visible in this repo, document that finding in the PR instead of making a no-op change.

## Files to Change

- `docs/agents/specs/loot-crawling/interactive-collection-enqueue.md` — reword 4 lines so `#NNNN` no longer starts a line
- `docs/agents/specs/loot-crawling/emission-endpoint.md` — reword 3 lines
- `docs/agents/specs/loot-crawling/source-to-collections.md` — reword 1 line
- `docs/agents/product/entities/game-item.md` — reword 1 line
- `docs/agents/specs/loot-crawling/collection-to-stl-models.md` — reword 3 lines
- `docs/agents/specs/loot-crawling/model-changes.md` — reword 1 line
- `docs/agents/specs/crawler-test-harness.md` — reword 2 lines
- `.codacy.yml` (or wherever Codacy's markdownlint rule config actually lives) — disable `MD018` repo-wide

## CI Checks

- root: `yarn lint_md` (CI job: `markdownlint`) — run after the rewording to confirm no new lint regressions (MD012/MD022/MD032) were introduced by the rewrap, even though MD018 itself isn't enforced by this job

## Notes

- Do not add a space after `#` anywhere — that would turn these prose lines into real CommonMark level-1 headings and corrupt the documents' structure/table of contents, which is worse than the current false-positive lint noise.
- Step 2's exact file/location is genuinely uncertain from repo inspection alone (Codacy's rule source isn't visible locally); whoever implements this should confirm empirically (e.g. by checking Codacy's dashboard for this repo, or re-running the Codacy scan after a config change) rather than guessing blindly.
