# Lint and review

- Run the markdown lint (`yarn lint_md`, via the project's docker-compose tooling) and fix every
  finding in the new/changed pages.
- Check that no permanent doc links into `docs/agents/specs/statistics-bug/`, every page links back
  to the index, and every *planned by #<id>* marker is present.
- Scan the pages for real data or secrets (IPs outside RFC 5737, `mjr_` values, the skip secret).
- Request the read-only reviews of the `data-access` and `security` agents on the PR, checking the
  export-endpoint contract against `docs/agents/access-control/` and
  `docs/agents/security-guidelines.md`; fold their findings into the pages.

## Files to Change

- `docs/agents/specs/statistics-bug.md` and `docs/agents/specs/statistics-bug/*.md` — fixes from
  lint and review only.
