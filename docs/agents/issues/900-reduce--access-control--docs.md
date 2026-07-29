# Issue: Reduce `access-control` docs

## Problem
The docs under `docs/agents/access-control/` are already split by resource (issue #446, #468),
with shared reference files (`principles.md`, `common-rules.md`, `user-roles.md`) that
per-resource files link back to instead of re-deriving rules. That structural split is not the
issue.

Despite it, the document set is still large — 28 files, several 10-20KB+, `character.md` alone
is 411 lines — because individual files mix the actual access rule with long justification
asides and pervasive historical issue-number citations (e.g. "issue #619 for PC, #713 for NPC",
"(issue #852)"). This makes the docs read like a changelog woven into a reference doc, rather
than a plain reference, and inflates the context an agent has to load to work on a single
resource.

## Solution
Keep the existing per-resource file structure and shared-reference files (`principles.md`,
`common-rules.md`, `user-roles.md`) as they are — no further folder restructuring or file
splitting is needed. Instead, rewrite every file under `docs/agents/access-control/` (including
the top-level `access-control.md` index) for concision:

- Remove issue-number citations (e.g. "issue #859", "(issue #712)") — history is already
  preserved via `git log`/`git blame`, so the reference docs don't need to carry it.
- Condense long justification/rationale asides down to the rule itself; where a rule is already
  stated in `principles.md`/`common-rules.md`, link to it instead of re-deriving it inline.
- Preserve every actual access rule and documented behavior exactly as-is — this is a rewrite
  for concision, not a change in what is documented or in the underlying access-control code.

### What this issue is not about
- No code changes — documentation only.
- No further splitting of the existing files (e.g. `character.md`, `character-item.md`,
  `upload.md` stay as single files).
- No change to which rules are documented, only how verbosely they're stated.

## Benefits
- Smaller context footprint when an agent loads these docs to work on a resource.
- Docs read as a clean reference instead of a changelog, making rules easier to find and trust.
- Easier to keep in sync going forward, with less prose to update per change.
