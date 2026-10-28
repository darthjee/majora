# Symptom

Part of the [Statistics Bug](../statistics-bug.md) specs (Epic #1696).

## New `Session` vs. new `Visit`

- A **new `Visit`** is expected: it opens when the session's latest visit has been inactive for
  longer than `MAJORA_STATISTICS_VISIT_INACTIVITY_SECONDS` (default 30 minutes).
- A **new `Session`** for a visitor that already has one is the suspected bug. A `Session` is the
  visitor (device/browser) identity, so a duplicate inflates unique visitors and splits a
  visitor's history.

The first task of the investigation is to confirm that the observed symptom is a new `Session`
row, not a new `Visit`.

## How sessions are reused today

See [Access Statistics](../../statistics.md#data-model) for the full model.

1. The signed `majora_statistics` cookie carries the session token. The middleware looks the
   `Session` up by token and domain.
2. The session is reused only when `session.ip` and `session.domain_id` match the current
   request. Otherwise a new `Session` row is created and a new cookie is set.
3. After the view runs, `_backfill_user` handles a logged-in user:
   - a session created in this same request gets the user attached **in place**;
   - a pre-existing anonymous session is always **rotated** to a new user-tied `Session`
     (login is a visit boundary).

## Legitimate new sessions

These create a new `Session` by design. `analyse.py` reports them separately and they do not
count as the bug:

- another browser or device;
- a private window;
- cleared cookies;
- logout (the view deletes the cookie);
- a real IP change of the client;
- bots that never keep cookies;
- cookies pointing to sessions removed by a statistics Clear (#1684).

## Background

- [Login is a visit boundary](../../statistics.md#visit-is-the-activity)
- [Tracking race](../../statistics.md#tracking-race) (#1683)
- [Client IP integrity](../../statistics.md#client-ip-integrity)
