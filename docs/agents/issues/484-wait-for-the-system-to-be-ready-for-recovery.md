# Issue: Wait for the system to be ready for recovery

## Description
When navigating to `/#/recover-password?token=<TOKEN>`, the backend might still be starting up (e.g. right after a deploy), so the password recovery form could be rendered before the server is actually able to handle requests.

## Problem
The `RecoverPassword` page (`frontend/assets/js/components/resources/account/pages/RecoverPassword.jsx`) renders the form immediately on load, without checking whether the backend is ready to serve requests. If the user opens the recovery link while the backend is still starting up, submitting the form may fail even though the token itself is valid.

## Expected Behavior
Before rendering the password recovery form, the page shows a loading spinner/message and polls a readiness endpoint every 5 seconds. While the readiness check responds with `502` or times out, the page keeps retrying indefinitely instead of rendering the form. Any other response (including statuses other than `200`, e.g. `404`/`500`) is treated as ready, and the form is rendered. This check is independent from the existing superuser-only, 60s-interval health indicator in the header.

## Solution
- Add a new backend endpoint, `/ready.json`, dedicated to readiness checks and reusable for future needs beyond this page. The endpoint response must include the `X-Skip-Cache` header so the proxy does not cache it.
- The frontend must request it with the `.json` extension so the request reaches the backend directly instead of being served from proxy cache.
- On the `RecoverPassword` page, poll `/ready.json` every 5 seconds before rendering the form: show a loading spinner/message while waiting, treat `502` responses and timeouts as "not ready yet" and keep retrying, and render the form once a non-502 response (typically `200`) is received.
- This is a new, independent polling mechanism scoped to this page — it does not reuse or modify the existing header health-check (`HealthClient`/`HeaderController`), which stays as-is.

## Benefits
Users following a password-recovery link right after a deploy won't hit a broken/confusing form — they'll see a loading state and wait until the backend is actually ready, and the flow works on the first try instead of erroring out. The new `/ready.json` endpoint is also reusable for any other future readiness-gating needs.
