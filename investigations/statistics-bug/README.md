# Statistics bug investigation

Temporary tooling for [Epic #1696](https://github.com/darthjee/majora/issues/1696): duplicated
statistics sessions. Issue #1702 adds `emulate.py`, which replays navigation scenarios against
the **local** stack and reports the statistics sessions and visits each scenario created, with
their tracking columns, flagging unexpected creation reasons.

Specs:

- [Scripts](../../docs/agents/specs/statistics-bug/scripts.md) — the contract of `emulate.py`.
- [Hypotheses](../../docs/agents/specs/statistics-bug/hypotheses.md) — what each scenario tests.
- [Tracking columns](../../docs/agents/specs/statistics-bug/tracking-columns.md) — creation
  reasons.
- [Export endpoint](../../docs/agents/specs/statistics-bug/export-endpoint.md) — export and
  device authorization.
- [Privacy](../../docs/agents/specs/statistics-bug/privacy.md).

This folder is **temporary**: it is deleted once the bug is fixed, after any durable knowledge
moves to `docs/agents/`.

## Prerequisites

- The local stack is up (`majora_proxy`, `majora_app`, `majora_mysql`, `majora_fe`), started
  from the root `docker-compose.yml`.
- A **local** staff user who can approve the device authorization in the local frontend.
- The root `.env` holds the local secrets:
  - `STATISTICS_SKIP_SECRET` — lets the script's own reads skip tracking;
  - `PROXY_SECRET` — needed only by the IP change scenario (it must match the backend's and
    Tent's `PROXY_SECRET`). Without it that scenario is reported as skipped.

  Their values are read from the environment only; they are never copied here, printed or
  logged. To pass one from the shell instead, use `run -e NAME`.

## Network

The service joins the project's Docker network as an external network. With the repository in a
folder named `majora`, the root compose file creates `majora_default` (check with
`docker network ls`). Override it with `MAJORA_DOCKER_NETWORK` when the folder has another
name:

```bash
MAJORA_DOCKER_NETWORK=myfolder_default docker-compose -f investigations/statistics-bug/docker-compose.yml run --rm emulate
```

## Run

From the repository root:

```bash
docker-compose -f investigations/statistics-bug/docker-compose.yml run --rm emulate
```

**Do not browse the local site during a run.** Every scenario reads back the sessions created
during its own time window; your browser's requests would be counted as the scenario's.

## Refresh-burst request list

See [Scenarios](#scenarios) (filled in by step 03).

## Reports

Reports are written to `reports/`, which is git-ignored. Anything copied from a report into the
repository or an issue is aggregated or anonymised (see the Privacy spec).
