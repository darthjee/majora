# Replace the old job names in requires and agent docs

1. In `.circleci/config.yml`, replace `pytest_views_game, pytest_views_rest, pytest_non_views` with `pytest_views, pytest_non_views` in every `requires:` list. That covers `coverage-final` and every tag-only release job: `build-and-release`, `upload_proxy_files`, `upload_fe_files`, `link_photos`, `link_files`, `link_domain`, `upload_admin_assets`, `wake-navi`, `client-release`, plus any other the grep finds.
2. Run `grep -rn 'pytest_views_game\|pytest_views_rest' .circleci .claude .github docs/agents/contributing.md AGENTS.md README.md`. Nothing may be left outside historical spec records.
3. Validate the config: `circleci config validate` (through docker if needed, see infra.md's CI Checks).
4. `.claude/agents/infra.md`:
   - in the pipeline diagram, replace the two view job boxes with one `[pytest_views]`, and note the parallelism if the diagram shows it for `pytest_non_views`;
   - in the job table, replace the two rows with one `pytest_views` row: "Run `games/tests/views/`, split by timings across 3 containers + upload partial coverage and the durations report";
   - in the `wake-navi` row, update the job names.
5. `docs/agents/contributing.md` (CI jobs per folder table, `backend/` row): replace the two names with `pytest_views`.
6. Check `.claude/agents/backend.md` and `.github/agents/*.md` for job names, and update any found.

## Files to Change
- `.circleci/config.yml` — the `requires:` lists.
- `.claude/agents/infra.md` — pipeline diagram, job table, `wake-navi` row.
- `docs/agents/contributing.md` — the CI jobs per folder table.
- `.claude/agents/backend.md`, `.github/agents/*.md` — only if they list the old names.
