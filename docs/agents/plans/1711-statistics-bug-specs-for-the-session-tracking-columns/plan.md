# Plan: Statistics bug: specs for the session tracking columns

Issue: [1711-statistics-bug-specs-for-the-session-tracking-columns.md](../../issues/1711-statistics-bug-specs-for-the-session-tracking-columns.md)

## Overview

Docs-only update of the Statistics Bug specs (`docs/agents/specs/statistics-bug.md` and
`docs/agents/specs/statistics-bug/`) to describe the permanent session tracking columns that
#1712 (storage), #1713 (API) and #1714 (UI) implement, and how the investigation uses them. No
code, no permanent docs: the implementing PRs write the permanent description into
`docs/agents/statistics.md`.

## Context

- Epic #1696 now adds `Session.first_path`, `Session.first_seen_logged`,
  `Session.creation_reason`, `Visit.first_path` and `Visit.last_path`.
- Path columns store the **route pattern** (`resolve(path_info).route`), never the raw path or
  query string, so no URL parameter, token or secret is ever stored — the device-authorization
  routes carry the request `uuid` (the poll secret) in the path. No route → `unresolved`.
- The specs currently forbid any middleware change but #1699's exemption, keep a stale
  `Status` column in the index, and rely on heuristics only.
- Specs convention (`docs/agents/specs.md`): specs are temporary design docs; permanent docs
  never link into `docs/agents/specs/statistics-bug/`, links only go outward.

## Steps

- [01 — New `tracking-columns.md` page](plan/01-tracking-columns-page.md)
- [02 — Index: aspect page, sub-issue table without status](plan/02-index.md)
- [03 — Investigation plan and symptom](plan/03-investigation-plan-and-symptom.md)
- [04 — Hypotheses: tracking evidence](plan/04-hypotheses.md)
- [05 — Export endpoint, scripts and privacy](plan/05-export-scripts-privacy.md)

## CI Checks

- Markdown: `docker-compose run --rm markdownlint` (CI job: `markdownlint`).

## Notes

- Describe the columns as **planned** (*planned by #1712/#1713/#1714*), in the same voice as
  the existing pages' "*Planned by …*" notes; nothing in the code changes here.
- Define each column and reason **once**, in `tracking-columns.md`; every other page links to
  it (`tracking-columns.md#columns`, `#creation-reasons`, `#path-values`) instead of
  repeating definitions.
- Public repo: examples use route patterns and placeholder values only — no real paths with
  real slugs, no ids, no IPs outside RFC 5737.
- Follow `docs/agents/documentation.md` formatting (line length, lists, tables).
