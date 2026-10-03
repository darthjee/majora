# Access-control docs and production topology

- **`docs/agents/access-control/staff-statistics.md`:** new, in the shape of
  `staff-cache.md`: one row per `staff/statistics/...json` endpoint known so far (GET only,
  staff/superuser only, 401 anonymous, 403 non-staff, restricted / not proxy-cached), the
  fields exposed (IPs included, per the access-and-security page), linking the model-level
  `access-control/statistics.md`. Tab specs append their endpoints later. Link it from
  `access-control/endpoints.md` (or the index the other staff docs use).
- **`docs/agents/permissions.yaml`:** decide whether the `staff` scope needs a note; add it
  only if the existing note doesn't already cover these endpoints.
- **Production topology check:** inspect `docker-compose.yml`, `dockerfiles/production_*`,
  `scripts/deploy.sh` and the Tent docs (`docs/agents/external/how-to-use-tent.md`) to
  confirm nothing in front of Tent replaces `REMOTE_ADDR` and that the backend port isn't
  exposed directly; record the finding (and any follow-up issue if it fails) in the page,
  consistent with `access-and-security.md` and `backend/statistics/middleware.py`.

## Files to Change
- `docs/agents/access-control/staff-statistics.md` — new access-control doc.
- `docs/agents/access-control/endpoints.md` — link to it, if that is where staff docs are indexed.
- `docs/agents/permissions.yaml` — only if a note is needed.
- `docs/agents/specs/access-statistics/shared-infrastructure.md` — Access-control and topology sections.
