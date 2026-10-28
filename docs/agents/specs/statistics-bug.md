# Statistics Bug

Investigation specs for Epic #1696. A visitor already tracked by a statistics `Session`
sometimes gets a **new** `Session` while navigating the site. This is suspected to happen on a
page refresh, when the frontend fires several API requests in parallel. These pages are the
shared contract for every sub-issue of the Epic: what the symptom is, which hypotheses to verify
and how, what the export endpoint exposes and to whom, how the investigation scripts behave and
which privacy rules apply.

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
- [Scripts](statistics-bug/scripts.md): `emulate.py` and `analyse.py` design for #1702 and
  #1703.
- [Environments](statistics-bug/environments.md): local vs. production differences.
- [Privacy](statistics-bug/privacy.md): token handling, reports, anonymisation.
- [Findings](statistics-bug/findings.md): placeholder, filled in by #1704.

## Sub-issues

This table is the only place that tracks status. Aspect pages link back here.

| Issue | Title | Page(s) | Status |
|-------|-------|---------|--------|
| #1697 | Write the investigation specs | all | in progress |
| #1698 | Add the investigator specialist agent | [Privacy](statistics-bug/privacy.md), [Scripts](statistics-bug/scripts.md) | open |
| #1699 | `statistics:read` scope and staff export endpoint (backend) | [Export endpoint](statistics-bug/export-endpoint.md) | open |
| #1700 | `statistics:read` scope in the token and device-authorization UI (frontend) | [Export endpoint](statistics-bug/export-endpoint.md) | open |
| #1701 | Bump version to release the `statistics:read` scope | [Investigation plan](statistics-bug/investigation-plan.md) | open |
| #1702 | Investigation folder and navigation emulation script | [Scripts](statistics-bug/scripts.md), [Hypotheses](statistics-bug/hypotheses.md) | open |
| #1703 | Production data analysis script | [Scripts](statistics-bug/scripts.md), [Privacy](statistics-bug/privacy.md) | open |
| #1704 | Code review and findings | [Hypotheses](statistics-bug/hypotheses.md), [Findings](statistics-bug/findings.md) | open |
| #1705 | Create the fix issue | [Investigation plan](statistics-bug/investigation-plan.md), [Findings](statistics-bug/findings.md) | open |

Sub-issues are referenced by number. When one is added, dropped or merged, update this table.

## Lifecycle

- **During the Epic:** a sub-issue that has to deviate from these pages updates the relevant
  page in the same PR, so the specs stay the source of truth. #1704 fills `findings.md` and
  updates the hypothesis statuses.
- **Removal:** a dedicated step of the fix work, after the post-fix check confirms the bug is
  gone:
  1. move durable knowledge into permanent docs: a short root-cause note and any clarified
     session-reuse rules into [Access Statistics](../statistics.md), the scope and endpoint
     into the access-control docs (already done by #1699);
  2. unregister this index from [Specs](../specs.md);
  3. delete this file and `docs/agents/specs/statistics-bug/`, together with
     `investigations/statistics-bug/`.
- **Dropped, not migrated:** hypotheses, scripts, environments, privacy (the rules live in the
  investigator docs from #1698) and detailed findings. The fix issue and git history keep them.
- Permanent docs must **not** link into `docs/agents/specs/statistics-bug/`. Links only go from
  these pages outward.
