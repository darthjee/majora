# Plan: Reduce docs

Issue: [343-reduce-docs.md](../issues/343-reduce-docs.md)

## Overview

Trim every in-scope file under `docs/agents` to remove content that merely restates what
the code already shows (field lists, endpoint signatures, step-by-step descriptions of
logic that can be found by reading `source/`, `frontend/`, or `proxy/`), while preserving
rationale, conventions, cross-cutting rules, and policy decisions that are not otherwise
discoverable. `HOW_TO_USE_DARTHJEE-TENT.md` and `HOW_TO_USE_NAVI.md` are out of scope
(mirrored from other repos). `access-control.md`, `security-guidelines.md`, and
`product.md` are treated conservatively — only obvious duplication/verbosity is cut, no
policy/rule/decision is removed even if it also happens to be visible in code.

This is a single-domain (docs-only) issue entirely within the architect's own scope —
no specialist agent has work here, so there is no agent split.

## Context

`docs/agents` has grown to ~3060 lines across in-scope files. Every specialist agent
invocation reads some subset of these docs, so bloat costs tokens on every run and
increases the chance the docs drift from the code they describe. The issue calls for a
trim pass, file by file, distinguishing "policy/rationale" (keep) from "restates the
code" (cut).

## Implementation Steps

### Step 1 — `architecture.md` (149 lines)

- Remove the "API Endpoints" table (duplicates the table already in root `AGENTS.md` and
  is directly derivable from `source/games/urls.py`).
- Remove the "Domain Models" table (duplicates root `AGENTS.md` and `source/games/models/`).
- Trim the per-path dev/prod routing tables to a short prose summary — the exact behavior
  is defined in `proxy/dev_configuration/rules/*.php` and `proxy/prod_configuration/`;
  keep only the fact that dev mode proxies to Vite and prod serves static files, plus the
  catch-all redirect rule (that convention isn't visible from a single file read).
- Keep: the two-app-through-Tent framing, the shared-volume rationale, the
  product.md/product-owner cross-reference (this is a policy pointer, not derivable from
  code).

### Step 2 — `frontend.md` (279 lines)

- Keep the Component/Controller/Helper convention explanation (rationale, not visible in
  any single file) but shrink the three code examples to shorter illustrative snippets —
  keep just enough to show the shape of each layer, not full working examples.
- Trim "Directory Structure" tree to the parts that aren't obvious from `ls`-ing the
  folder; keep the prose linking each folder to its role.
- Keep "Adding a New Page" / "Adding a New Element" checklists (process knowledge, not
  derivable from code).
- Trim "Routing", "Pagination", "API Client", "Bootstrap" sections to short pointers to
  the relevant files rather than restating their current contents (which are directly
  readable in `HashRouteResolver.js`, the `Pagination*` files, and `GenericClient.js`).
- Keep the ESLint/JSDoc rules and the test-writing conventions (`renderToStaticMarkup`,
  flushing promises) — these are conventions, not visible from reading one file.

### Step 3 — `contributing.md` (129 lines)

- Already mostly policy/convention (commit hygiene, DoD, CI mapping, dependency
  injection, refactoring guidance) — keep almost all of it.
- Shrink the three inline code examples (Python method-order, DI, factory-function) to
  the minimal snippet needed to illustrate the rule, not full multi-line before/after
  blocks.

### Step 4 — `product.md` (146 lines)

- Conservative pass only. Keep every entity definition, the ownership chain, GameMaster/
  Staff role definitions, editing rules, and the summary table verbatim — this is policy
  read by the `product-owner` agent.
- Only cut clear verbosity, e.g. redundant restatement of the same rule across the
  "Editing Rules" section and the "Summary Table" — keep both since the table is a
  by-design quick-reference, but tighten any sentence that repeats the same fact three
  times in the prose above it.

### Step 5 — `security-guidelines.md` (85 lines)

- Conservative pass only. This is the security agent's authoritative checklist — keep all
  8 numbered rule sections in full, no rule/policy removed.
- Only cut clear duplication/verbosity in the prose (e.g. sentences repeating the same
  point twice within a single bullet).

### Step 6 — `access-control.md` (660 lines)

- Conservative pass only — this is the data-access agent's authoritative reference.
- Keep every "who can" table, every field-exposure note, every edit-rights-logic
  subsection, and every issue-number cross-reference (these encode decisions, not derivable
  from a single code read).
- Cut only clearly redundant restatement, e.g. sentences that re-explain the same fact
  already stated in the adjacent table, or historical narration that adds no decision
  (e.g. trim "As of issue #NNN" scaffolding to the minimum needed to explain *why* a rule
  exists, without repeating the full history of how the field got there, when a rule is
  otherwise self-evident from the table). Given the conservative mandate, prefer leaving
  a passage in if there's any doubt it encodes a policy decision.

### Step 7 — `pagination.md` (98 lines)

- Trim the "Query params accepted" / "Response headers set" tables and the
  `GenericClient.fetchIndex` return shape to short prose — directly readable in
  `source/games/paginator.py` and `frontend/assets/js/client/GenericClient.js`.
- Keep the "Endpoints with pagination" table (this is a cross-cutting list that is not
  obvious from reading any single view file) and the ellipsis-pattern description
  (an algorithmic convention, not obvious from a quick code read).
- Keep the "Key files" table as a navigation aid.

### Step 8 — `i18n.md` (116 lines)

- Keep the rationale for a hand-rolled i18n layer, the `namespace.key` convention, and
  the "Adding a new language" checklist (process knowledge).
- Trim the `Translator.t()` usage example and the language-selector/persistence
  walkthrough to short pointers — the exact mechanics are directly readable in
  `Translator.js`, `LanguageStorage.js`, and `LanguageEvents.js`.

### Step 9 — `folder-structure.md` (67 lines)

- This file is already a compact top-level directory map with one-line descriptions —
  mostly non-derivable-in-one-glance rationale (why each folder exists). Keep as is or
  make only minor trims (e.g. collapse the `dockerfiles/` per-image breakdown, which is
  obvious from `ls dockerfiles/`, into a single summary line).

### Step 10 — `cache-warmer.md` (58 lines)

- Keep the Navi rationale, the CI job wiring, and the local-testing instructions (none of
  this is derivable from code alone).
- Trim the "Resource" table to keep only the chaining relationship (which resource feeds
  which) — the exact URL patterns are visible in `.circleci/navi_config.yaml` itself.

### Step 11 — `flow.md` (5 lines)

- Already minimal (a placeholder). No trimming needed; leave untouched unless writing
  this doc is judged in-scope — the issue is about *reducing* docs, not writing new ones,
  so this file is skipped.

### Step 12 — Final consistency pass

- Re-read every edited file once more, end to end, to confirm no now-dangling
  cross-references were left (e.g. a section removed from `architecture.md` that another
  doc still points to by name) and that Markdown structure (headers, tables) remains
  valid after trims.

## Files to Change

- `docs/agents/architecture.md` — remove endpoint/model tables duplicated from `AGENTS.md`/code, shrink routing tables
- `docs/agents/frontend.md` — shrink code examples and mechanic-restating sections, keep conventions
- `docs/agents/contributing.md` — shrink inline code examples
- `docs/agents/product.md` — conservative trim of verbosity only
- `docs/agents/security-guidelines.md` — conservative trim of verbosity only
- `docs/agents/access-control.md` — conservative trim of verbosity/history scaffolding only
- `docs/agents/pagination.md` — trim mechanics restating code, keep cross-cutting tables
- `docs/agents/i18n.md` — trim mechanics restating code, keep conventions/checklist
- `docs/agents/folder-structure.md` — minor trim only
- `docs/agents/cache-warmer.md` — trim resource table, keep rationale/CI wiring
- `docs/agents/flow.md` — no change

## CI Checks

None of the CI jobs in `.circleci/config.yml` cover `docs/` changes — no local command to
run before opening the PR.

## Notes

- No specialist agent has work here; the architect implements this plan directly.
- Because this issue touches no code, no `data-access` or `security` re-review is
  triggered per the coordination rules (no new endpoint, no serializer/permission change).
- Judgment calls on "what counts as derivable from code" are inherently subjective; when in
  doubt for `access-control.md`, `security-guidelines.md`, and `product.md`, err on the
  side of keeping content, per the issue's explicit conservative mandate for those three
  files.
