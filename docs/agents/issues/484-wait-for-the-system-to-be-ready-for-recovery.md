# Wait for the system to be ready for recovery

## Context

The password-recovery page (`/#/recover-password?token=<TOKEN>`) is reachable
immediately after a deploy or backend restart, while the backend may still be
starting up. If the recovery form renders before the backend is actually
ready, the user can submit a request that fails with a `502` (or times out),
producing a confusing error instead of a working form.

The header already polls a health-check endpoint (`HealthClient#check`,
backed by `/health.json`) to track backend availability for the logged-in
app shell. The recovery page needs the same kind of readiness check before
it renders the form, so users only see the form once the backend is
confirmed to be responding.

## What needs to be done

- Frontend:
  - Before rendering the recovery form, send a health-check request (reusing
    `HealthClient`/`/health.json`, the same one used by the header) to
    confirm the backend is ready.
  - While waiting, show a loading/waiting state instead of the form.
  - Treat a `502` response or a request timeout as "not ready yet" — do not
    surface these as errors; retry the health check again after a short
    delay instead.
  - Only render the recovery form once the health check responds with `200`.
  - Add/extend Jasmine specs covering: initial waiting state, retry on `502`,
    retry on timeout, and rendering the form once the check succeeds.

## Acceptance criteria

- [ ] Visiting `/#/recover-password?token=<TOKEN>` while the backend is not
      yet responding shows a waiting state, not the recovery form.
- [ ] A `502` response from the health check is treated as "not ready" and
      triggers another attempt, without showing an error to the user.
- [ ] A timed-out health check is treated as "not ready" and triggers
      another attempt, without showing an error to the user.
- [ ] Once the health check responds with `200`, the recovery form renders
      normally.
- [ ] New/updated Jasmine specs cover the waiting, retry, and ready states.
