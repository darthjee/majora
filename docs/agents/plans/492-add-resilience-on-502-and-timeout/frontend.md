# Frontend Plan: Add resilience on 502 and timeout

Main plan: [plan.md](plan.md)

## Shared contracts

This agent adds three i18n keys to `frontend/assets/i18n/en.yaml`, under the existing
`header:` section: `resilience_idle_alt`, `resilience_requesting_alt`,
`resilience_retrying_alt`. The translator agent mirrors these exact key names into
`pt.yaml`. Reference them via `Translator.t('header.resilience_idle_alt')` etc.

## Context

All HTTP requests funnel through `BaseClient#request` (`frontend/assets/js/client/BaseClient.js`) —
every resource client (`GameClient`, `CharacterClient`, `AuthClient`, `GenericClient`, ...)
extends it and ultimately calls this single method, which does one unretried `fetch` today.

Two clients already implement bespoke 502-aware polling that must **not** simply inherit a
blanket retry, because they rely on observing a `502` on a single attempt:
- `HealthClient#check()` (`frontend/assets/js/client/HealthClient.js`) — polled every 60s by
  `HeaderController#startHealthCheck` (`components/common/controllers/HeaderController.js:127-147`),
  which sets the superuser-only `.server-status` dot to `'down'` specifically when a single
  check returns `502`. If this call were silently retried until success, the dot would never
  show `'down'`.
- `ReadyClient#check()` (`frontend/assets/js/client/ReadyClient.js`) — polled by
  `RecoverPasswordController#waitUntilReady`/`#checkReady`/`#wait`
  (`components/resources/account/pages/controllers/RecoverPasswordController.js:49-78`), which
  already hand-rolls the exact "retry indefinitely on 502 or thrown error" loop this issue
  asks to extract into a reusable class.

Neither `HealthClient` nor `ReadyClient` request currently sets a timeout via a signal other
than their own explicit `AbortSignal.timeout(5000)`; ordinary data-fetching clients
(`GameClient`, `CharacterClient`, etc.) pass no `signal` at all today, so a stalled
connection on those calls never currently rejects with a timeout. For the "timeout" half of
this issue to mean anything for ordinary GET calls, `BaseClient#request` needs to apply a
default timeout (reuse the existing 5s convention) when the caller doesn't supply its own
`signal`.

## Implementation Steps

### Step 1 — Resilience state tracker

Add `frontend/assets/js/utils/ResilienceEvents.js`, following the existing
`utils/AuthEvents.js` pattern (a static class dispatching/subscribing to a
`window` `CustomEvent`, no-op when `window` is undefined). It tracks the number of
in-flight resilient requests and the number currently in a retry-wait, exposing:
- `requestStarted()` / `requestSucceeded()` — in-flight counter.
- `retryScheduled()` / `retryAttempting()` — retry-wait counter (a request that fails
  transiently moves from "in-flight" to "retry-wait" until its next attempt starts).
- `getStatus()` → `'idle' | 'requesting' | 'retrying'`, derived as: any retry-wait → `'retrying'`;
  else any in-flight → `'requesting'`; else `'idle'`.
- `subscribe(handler)` / `unsubscribe(handler)`.

### Step 2 — `ResilientRequest` class

Add `frontend/assets/js/client/ResilientRequest.js`. Constructor takes the attempt function
(`() => Promise<Response>`) and options (retry delay, default `5000`ms, matching
`RecoverPasswordController`'s existing default). `run(cancelToken)`:
- Calls `ResilienceEvents.requestStarted()` once.
- Loops: run the attempt; classify the outcome as a **transient failure** when the response
  status is `502`, or the attempt throws with `error.name === 'TimeoutError'` (the error
  `AbortSignal.timeout` produces) — any other thrown error propagates immediately instead of
  retrying forever, and any other response (including non-502 error statuses) is treated as
  final, matching `ReadyClient`'s current "not 502 = ready" semantics.
- On transient failure: `ResilienceEvents.retryScheduled()`, wait the retry delay (respecting
  `cancelToken` the same way `RecoverPasswordController#waitUntilReady` does today, so a
  pending retry never resolves after the caller unmounted), `ResilienceEvents.retryAttempting()`,
  loop again.
- On final outcome (success or non-retryable failure): `ResilienceEvents.requestSucceeded()`
  (decrements in-flight regardless of outcome — name it for the common case, but it just
  means "this logical request is done") and resolve/return the response (or rethrow).

Cover with a spec at `frontend/specs/assets/js/client/ResilientRequestSpec.js`: retries past
one or more `502`s and a timeout rejection before resolving; does not retry a `404`/`500`;
propagates a non-timeout thrown error immediately; drives `ResilienceEvents` transitions
through a full retry cycle.

### Step 3 — Wire into `BaseClient#request`

Update `BaseClient#request` (`frontend/assets/js/client/BaseClient.js:27-46`) to:
- Apply a default `AbortSignal.timeout(5000)` when no `signal` is passed in `options`.
- Accept a new `retry` option, defaulting to `true` when `method === 'GET'` (the default),
  `false` otherwise. When `retry` is true, wrap the actual `fetch` call in a
  `ResilientRequest` as built in Step 2; when false, behave exactly as today (a single
  attempt, whatever error it throws propagates).
- `HealthClient#check()` and `ReadyClient#check()` must explicitly pass `{ retry: false }`
  (keeping their own single-attempt-per-call semantics; `ReadyClient` is refactored to use
  `ResilientRequest` at the *controller* level instead, per Step 4) — call this out clearly
  in the diff/PR description since it's easy to regress silently.

Update `frontend/specs/assets/js/client/BaseClient/*Spec.js` (new spec file alongside the
existing `skipCacheHeaderSpec.js`) to cover: GET requests retry through `ResilientRequest` by
default; POST/PATCH/DELETE do not; an explicit `{ retry: false }` override on a GET request
disables it; a default timeout signal is attached when none is supplied.

### Step 4 — Reuse `ResilientRequest` in `RecoverPasswordController`

Replace `RecoverPasswordController#waitUntilReady`/`#checkReady`/`#wait`
(`components/resources/account/pages/controllers/RecoverPasswordController.js:49-78`) with a
call to `new ResilientRequest(() => this.readyClient.check()).run(cancelToken)`, keeping the
same public signature (`waitUntilReady(setReady, delayMs, cancelToken)`) and cancellation
behavior. Update `RecoverPasswordControllerSpec.js` accordingly — assertions that exercised
the old private loop directly should instead assert `ResilientRequest` is invoked/awaited
and that `setReady` still isn't called after cancellation.

### Step 5 — Header resilience indicator

Add `Icons.js` (`frontend/assets/js/utils/Icons.js`) entries: `lightningCharge:
'bi-lightning-charge'`, `lightningChargeFill: 'bi-lightning-charge-fill'`, `hourglassSplit:
'bi-hourglass-split'`.

Add a new shared element (it's rendered from the app-shell `Header`, so it belongs under
`components/common/` per `docs/agents/frontend.md`'s "Pages vs Elements"):
- `components/common/ResilienceIndicator.jsx` — subscribes to `ResilienceEvents` in its own
  effect (mirrors `Header.jsx`'s subscribe/unsubscribe-in-cleanup pattern), holds `status` in
  local state.
- `components/common/controllers/ResilienceIndicatorController.js` — thin controller wrapping
  `ResilienceEvents.subscribe`/`unsubscribe` and exposing the current `getStatus()`.
- `components/common/helpers/ResilienceIndicatorHelper.jsx` — renders one `<i className="bi ...">`
  per status, following the existing `<i className={`bi ${Icons.viewAs}`} ... title={...}>`
  pattern from `HeaderHelper#renderViewAsLink`:
  - `idle` → green, `Icons.lightningCharge`, `Translator.t('header.resilience_idle_alt')`.
  - `requesting` → yellow, `Icons.lightningChargeFill`, `Translator.t('header.resilience_requesting_alt')`.
  - `retrying` → red, `Icons.hourglassSplit`, `Translator.t('header.resilience_retrying_alt')`.
  Colors: reuse Bootstrap text utility classes (`text-success` / `text-warning` /
  `text-danger`) rather than introducing new custom CSS.

Render `<ResilienceIndicator />` in `HeaderHelper.render` (`components/common/helpers/HeaderHelper.jsx:39-43`),
inside the same `Nav` group, right after `<LanguageSelector .../>`. Unlike
`#renderServerStatus` (superuser-only), this indicator is visible to every user — no
`isSuperUser` gating.

Add specs: `ResilienceIndicatorSpec.js`, `ResilienceIndicatorControllerSpec.js`,
`ResilienceIndicatorHelperSpec.js` (mirroring the existing `Header`/`HeaderHelper` spec
folder layout), and update `HeaderHelperSpec`/`HeaderSpec` expectations to include the new
element.

### Step 6 — English translation keys

Add the three keys under `header:` in `frontend/assets/i18n/en.yaml` (see "Shared contracts"
above) with English copy `Idle` / `Requesting` / `Retrying`. Leave `pt.yaml` to the
translator agent.

## Files to Change

- `frontend/assets/js/utils/ResilienceEvents.js` — new: subscribable idle/requesting/retrying tracker.
- `frontend/assets/js/client/ResilientRequest.js` — new: retry-until-success-on-502/timeout wrapper.
- `frontend/assets/js/client/BaseClient.js` — default timeout + opt-in/opt-out retry wiring.
- `frontend/assets/js/client/HealthClient.js` — explicit `{ retry: false }`.
- `frontend/assets/js/client/ReadyClient.js` — explicit `{ retry: false }`.
- `frontend/assets/js/components/resources/account/pages/controllers/RecoverPasswordController.js` — reuse `ResilientRequest`.
- `frontend/assets/js/utils/Icons.js` — new icon entries.
- `frontend/assets/js/components/common/ResilienceIndicator.jsx` — new.
- `frontend/assets/js/components/common/controllers/ResilienceIndicatorController.js` — new.
- `frontend/assets/js/components/common/helpers/ResilienceIndicatorHelper.jsx` — new.
- `frontend/assets/js/components/common/helpers/HeaderHelper.jsx` — render the new indicator after `LanguageSelector`.
- `frontend/assets/i18n/en.yaml` — new `header.resilience_*_alt` keys.
- `frontend/specs/assets/js/client/ResilientRequestSpec.js` — new.
- `frontend/specs/assets/js/client/BaseClient/retrySpec.js` — new.
- `frontend/specs/assets/js/components/resources/account/pages/controllers/RecoverPasswordControllerSpec.js` — updated.
- `frontend/specs/assets/js/components/common/ResilienceIndicator*` — new spec files.
- `frontend/specs/assets/js/components/common/helpers/HeaderHelper` / `HeaderSpec.js` — updated expectations.

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn test` (CI job: `jasmine`)
- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)
- `frontend`: `docker-compose run --rm majora_fe npm run check_i18n` (CI job: `frontend-checks`) — will fail until the translator agent's `pt.yaml` keys land too.

## Notes

- Applying a default timeout to every request in `BaseClient#request` is a behavior change
  beyond the letter of the issue (today only `HealthClient`/`ReadyClient` time out) — it's
  necessary for the "timeout" half of this issue to apply to ordinary data fetches, but is
  worth calling out explicitly in the PR description.
- Retrying indefinitely with no cap is what the issue asks for ("keep on trying"); if a
  backend outage is prolonged rather than a boot-time blip, affected pages will spin
  indefinitely showing the red "retrying" indicator instead of an error — this is the
  intended trade-off per the issue discussion, not a bug.
- Non-idempotent requests (POST/PATCH/PUT/DELETE) are deliberately excluded from retry to
  avoid duplicate writes; they keep today's fail-fast behavior.
