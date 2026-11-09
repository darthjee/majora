# Plan: Statistics bug: create the fix issue

Issue: [1705-statistics-bug-create-the-fix-issue.md](../../issues/1705-statistics-bug-create-the-fix-issue.md)

## Overview

Turn the findings of #1704 into a fix **Epic** on GitHub with seven sub-issues, recording the
owner's decisions (stop exposing the direct host, reuse the session on an IP change, remove the
`statistics:read` scope and export endpoint in the cleanup), and point the investigation specs
at it. No application code changes in this issue.

## Context

- Root cause and proposed directions: `docs/agents/specs/statistics-bug/findings.md`.
- Removal rules for the specs: the *Lifecycle* section of `docs/agents/specs/statistics-bug.md`.
- The repository is public: issue bodies carry no real IPs, ids, tokens, secrets or hostnames
  (the direct host is described, never named).

## Steps

- [01 — Draft the Epic and sub-issue bodies](plan/01-draft-issue-bodies.md)
- [02 — Create the Epic and sub-issues on GitHub](plan/02-create-github-issues.md)
- [03 — Point the investigation specs at the fix Epic](plan/03-update-specs.md)

## CI Checks

- Markdown only: Codacy markdownlint (`.markdownlint.json`) on the changed docs.

## Notes

- Creating GitHub issues is the deliverable; do it once. If a run is resumed, check for an
  existing Epic titled "Statistics bug: fix" before creating anything.
- Race 2a (no-cookie burst, amplified by cache hits) is left out of the fix by design: low
  volume, and its fix would be in the frontend or the cache. The Epic mentions it as known and
  not addressed.
- The post-fix check (sub-issue 5) must run before the cleanup (sub-issue 6), because it needs
  the `statistics:read` scope and the export endpoint that the cleanup removes.
