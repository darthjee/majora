# Investigator Plan: Statistics bug: investigation folder and navigation emulation script

Main plan: [plan.md](plan.md)

## Shared contracts

- Everything lives under `investigations/statistics-bug/`; infra excludes `investigations/**`
  from markdownlint and Codacy. Do not edit anything outside the folder (application code,
  root `.gitignore`, CI config).

## Steps

- [01 — Folder scaffold and standalone compose](investigator/01-folder-scaffold.md)
- [02 — Local client: safety, secrets, token and export reader](investigator/02-local-client.md)
- [03 — Navigation scenarios](investigator/03-scenarios.md)
- [04 — Report, expectation checks and local run](investigator/04-report-and-run.md)

## CI Checks

None: the folder is excluded from CI. Verification is the local run in step 04.

## Notes

- Follow the safety rules in `docs/agents/investigator.md` and `.claude/agents/investigator.md`:
  local stack only, tokens in memory only, secrets never printed, reports git-ignored, no real
  IPs or identifiers in anything committed.
- Specs: `docs/agents/specs/statistics-bug/scripts.md` (contract), `hypotheses.md` (scenario →
  hypothesis), `tracking-columns.md` (creation reasons), `export-endpoint.md` (export and
  device authorization).
- If the specs need a correction found while implementing (for example a route name), update
  the spec page in the same PR.
- Everything runs through `docker-compose -f investigations/statistics-bug/docker-compose.yml`;
  no Python on the host.
