# Issue: Docs: reword 15 line-wrapped #issue references under docs/agents/specs/ so they stop tripping Codacy's markdownlint MD018

## Description

Codacy's markdownlint scan (`MD018`, CodeStyle, Info severity) flags 15 lines across `docs/agents/specs/` and `docs/agents/product/entities/` for looking like an atx-style heading missing a space after `#` (e.g. `#Heading` instead of `# Heading`).

Investigation shows none of the 15 flagged lines are actually intended as headings. Each is a prose paragraph that has been hard-wrapped so that a GitHub issue reference such as `#1262` lands as the first token on a line — for example:

```
...since
#1262 had no standalone Collection-only creation call. **This is resolved**:
```

`MD018` pattern-matches "line starts with 1-6 `#` characters followed by a non-space character" with no semantic awareness of GitHub issue references, so it fires on these even though no heading was intended.

## Problem

Adding a space after `#` as MD018 literally suggests (`#1262` → `# 1262`) would make things worse, not better: in CommonMark, a line starting with `# ` is a real level-1 atx heading. Applying that "fix" would inject 15 spurious top-level headings into the middle of prose paragraphs across these spec/product docs, breaking each document's structure and table of contents — the exact failure mode MD018 exists to prevent, just triggered by the wrong fix.

## Solution

For each of the 15 locations below, reword/rewrap the sentence so the `#NNNN` GitHub issue reference is no longer the first token on its line — e.g. move a preceding word onto that line, or restructure the sentence — while preserving the paragraph's meaning and the surrounding prose-wrap style. Do **not** add a space after `#`.

- docs/agents/specs/loot-crawling/interactive-collection-enqueue.md:5, :16, :245, :312
- docs/agents/specs/loot-crawling/emission-endpoint.md:115, :116, :124
- docs/agents/specs/loot-crawling/source-to-collections.md:27
- docs/agents/product/entities/game-item.md:9
- docs/agents/specs/loot-crawling/collection-to-stl-models.md:12, :83, :153
- docs/agents/specs/loot-crawling/model-changes.md:32
- docs/agents/specs/crawler-test-harness.md:11, :143

Additionally, guard against this false positive recurring as these docs keep getting edited: disable `MD018` repo-wide for `**/*.md`. It is already absent from `.markdownlint-cli2.jsonc`'s enabled rule set, so first verify whether that file is actually what governs Codacy's scan; if Codacy consults `.codacy.yml`'s markdownlint engine config separately, extend that instead. The pattern — a hard-wrapped GitHub issue reference like `#1234` landing as the first token on a line — is inherent to how these specs write issue references and will keep triggering MD018 on future edits otherwise.

## Acceptance criteria

- [ ] None of the 15 flagged lines start with `#` followed by a digit anymore
- [ ] No new atx headings (real or accidental) were introduced by the rewording
- [ ] Each reworded paragraph still reads naturally and preserves its original meaning
- [ ] `MD018` is disabled repo-wide in whichever config actually governs Codacy's markdownlint scan
- [ ] Codacy's markdownlint `MD018` finding count drops to 0, both for these files and repo-wide going forward

## Benefits

Clears the Codacy `MD018` findings without corrupting document structure, and keeps the spec/product docs' prose readable and their headings/table-of-contents accurate.
Also prevents the same false positive from resurfacing on future edits to these (or other) docs that reference GitHub issue numbers in wrapped prose.
