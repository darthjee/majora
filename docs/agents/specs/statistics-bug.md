# Statistics Bug

Investigation specs for Epic #1696. A visitor already tracked by a statistics `Session`
sometimes gets a **new** `Session` while navigating the site. This is suspected to happen on a
page refresh, when the frontend fires several API requests in parallel. These pages are the
shared contract for every sub-issue of the Epic: what the symptom is, which hypotheses to verify
and how, what the export endpoint exposes and to whom, which session tracking columns are added
and what they record, how the investigation scripts behave and which privacy rules apply.

Background on how statistics are recorded today:
[Access Statistics](../statistics.md).

## Aspect pages

- [Investigation plan](statistics-bug/investigation-plan.md): the two angles, sub-issue order,
  definition of done.
- [Symptom](statistics-bug/symptom.md): new `Session` vs. new `Visit`, how sessions are reused
  today, legitimate new sessions.
- [Hypotheses](statistics-bug/hypotheses.md): each suspected cause and how it is confirmed or
  ruled out.
- [Export endpoint & `statistics:read` scope](statistics-bug/export-endpoint.md): the contract
  for #1699 and #1700, with the access matrix.
- [Tracking columns](statistics-bug/tracking-columns.md): the session and visit tracking columns
  (#1712–#1714), creation reasons and path values.
- [Scripts](statistics-bug/scripts.md): `emulate.py` and `analyse.py` design for #1702 and
  #1703.
- [Environments](statistics-bug/environments.md): local vs. production differences.
- [Privacy](statistics-bug/privacy.md): token handling, reports, anonymisation.
- [Findings](statistics-bug/findings.md): placeholder, filled in by #1704.

## Sub-issues

Status lives on GitHub: see Epic #1696's sub-issues. This table maps each sub-issue to the spec
pages it follows.

| Issue | Title | Page(s) |
|-------|-------|---------|
| #1697 | Write the investigation specs | all |
| #1698 | Add the investigator specialist agent | [Privacy](statistics-bug/privacy.md), [Scripts](statistics-bug/scripts.md) |
| #1699 | `statistics:read` scope and staff export endpoint (backend) | [Export endpoint](statistics-bug/export-endpoint.md) |
| #1700 | `statistics:read` scope in the token and device-authorization UI (frontend) | [Export endpoint](statistics-bug/export-endpoint.md) |
| #1701 | Bump version to release the `statistics:read` scope and the session tracking columns | [Investigation plan](statistics-bug/investigation-plan.md), [Tracking columns](statistics-bug/tracking-columns.md) |
| #1702 | Investigation folder and navigation emulation script | [Scripts](statistics-bug/scripts.md), [Hypotheses](statistics-bug/hypotheses.md), [Tracking columns](statistics-bug/tracking-columns.md) |
| #1703 | Production data analysis script | [Scripts](statistics-bug/scripts.md), [Privacy](statistics-bug/privacy.md), [Tracking columns](statistics-bug/tracking-columns.md) |
| #1704 | Code review and findings | [Hypotheses](statistics-bug/hypotheses.md), [Findings](statistics-bug/findings.md) |
| #1705 | Create the fix issue | [Investigation plan](statistics-bug/investigation-plan.md), [Findings](statistics-bug/findings.md) |
| #1708 | Scoped tokens through device authorization (backend) | [Export endpoint](statistics-bug/export-endpoint.md) |
| #1711 | Specs for the session tracking columns | [Tracking columns](statistics-bug/tracking-columns.md), [Investigation plan](statistics-bug/investigation-plan.md), [Symptom](statistics-bug/symptom.md), [Hypotheses](statistics-bug/hypotheses.md), [Export endpoint](statistics-bug/export-endpoint.md), [Scripts](statistics-bug/scripts.md), [Privacy](statistics-bug/privacy.md) |
| #1712 | Store creation path, reason and logged state (backend) | [Tracking columns](statistics-bug/tracking-columns.md) |
| #1713 | Session tracking columns in the staff statistics API (backend) | [Tracking columns](statistics-bug/tracking-columns.md), [Export endpoint](statistics-bug/export-endpoint.md) |
| #1714 | Session tracking columns on the staff visits page (frontend) | [Tracking columns](statistics-bug/tracking-columns.md) |

Sub-issues are referenced by number. #1699 covers the scope and the export endpoint; scoped
device authorization moved to #1708. When a sub-issue is added or dropped, update this table.

## Lifecycle

- **During the Epic:** a sub-issue that has to deviate from these pages updates the relevant
  page in the same PR, so the specs stay the source of truth. #1704 fills `findings.md` and
  updates the hypothesis statuses.
- **Removal:** a dedicated step of the fix work, after the post-fix check confirms the bug is
  gone:
  1. move durable knowledge into permanent docs: a short root-cause note and any clarified
     session-reuse rules into [Access Statistics](../statistics.md), the scope and endpoint
     into the access-control docs (already done by #1699). The tracking columns need no
     migration: their permanent docs are written by #1712–#1714;
  2. unregister this index from [Specs](../specs.md);
  3. delete this file and `docs/agents/specs/statistics-bug/`, together with
     `investigations/statistics-bug/`.
- **Dropped, not migrated:** hypotheses, scripts, environments, privacy (the rules live in the
  investigator docs from #1698) and detailed findings. The fix issue and git history keep them.
- Permanent docs must **not** link into `docs/agents/specs/statistics-bug/`. Links only go from
  these pages outward.
