# Issue: Reduce docs/agents/access-control.md size

## Description
`docs/agents/access-control.md` is the authoritative reference for data access rules in
Majora — it documents which roles can access which models, endpoints, and fields. It has
grown to ~1095 lines (~73KB) across 22 sections, one per model/resource. It is read
end-to-end by the `data-access` and `security` specialist agents on every relevant
review, and is manually kept in sync by the architect/backend agents whenever a new model
or endpoint is introduced.

## Problem
The doc's size drives up token cost every time an agent reads it, and makes it harder for
humans and agents to scan for accuracy. Three things inflate it without adding real
information density:
- The same permission patterns (e.g. "GameMaster of that game, or superuser") are restated
  in full, inline, across dozens of sections instead of being defined once.
- Prose describes every single route and field individually, even where many routes in a
  section share one pattern.
- Inline historical provenance notes (e.g. "(issue #254)", "as of issue #275") are
  scattered throughout the rules text, adding bulk without describing current behavior —
  git history already records when something changed.

## Solution
Rewrite `docs/agents/access-control.md` to be significantly smaller while remaining a
lossless, authoritative source for every access rule/fact it currently documents — this is
a trim of prose and redundancy, not a removal of information the `data-access` and
`security` agents depend on (per-endpoint and per-field access rules must all still be
derivable from the doc). Concretely:
- Extract repeated permission patterns into a small set of named shared rules (e.g. a
  "GM-or-superuser" rule) defined once near the top, and have each section reference them
  by name instead of restating them.
- Favor concise rule statements and tables over prose that spells out every single route
  individually when a section's routes share a common pattern.
- Shorten sentences and remove redundant wording throughout.
- Remove inline historical issue-number citations from the rules text (e.g. "(issue
  #254)", "as of issue #275") — current behavior only, no changelog-style annotations.
- Keep the document organized by model/resource, preserving the current section topics
  (e.g. "Treasure", "Game") since other docs, like `docs/agents/product.md`, refer to
  sections by name.

## Benefits
- Lower token cost for the `data-access` and `security` agents (and any human) reading
  the doc on every relevant review.
- Easier to keep accurate and in sync as new models/endpoints are added, since common
  patterns are defined once instead of copy-pasted.
- Easier to scan and spot-check for correctness.
