# Timeouts and retries
Extend `HttpClient` per the spec's Retries and timeouts section.

- **Timeouts.** Per request, use `timeout` (call option, else config); when > 0, create
  `AbortSignal.timeout(ms)` and combine it with a caller `signal` via `AbortSignal.any`. A
  timeout abort → `NetworkError` with `timeout === true` and `cause` = abort reason. A caller
  abort → `NetworkError` with `timeout === false` (and is never retried).
- **Retries.** Only `GET`. Retry count from call option, else config. Retried on:
  `NetworkError` (not caller abort), 502, 503, 504, 429. Never on other 4xx or 500.
  Backoff: exponential with jitter, base about 500 ms (≈0.5 s, then ≈1 s). On 429 with a
  `Retry-After` header (seconds or HTTP date), wait that long instead. Each attempt gets a fresh
  timeout signal.
- **Injectable sleep.** Accept a `sleep` (and optionally `random`) in the `HttpClient`
  constructor (not a public `MajoraClient` option, or documented as testing-only) so specs run
  instantly and deterministically.
- Consider extracting a small `RetryPolicy` class (`shouldRetry(method, errorOrStatus)`,
  `delay(attempt, response)`) to keep `HttpClient` under the complexity and max-lines limits.

Specs: the full retry / no-retry matrix (GET vs POST/PATCH/DELETE × network error, 429, 500,
502, 503, 504, 400–404), retry count exhaustion surfaces the last error, `retries: 0`,
`Retry-After` seconds and date, timeout produces `NetworkError` with `timeout: true`,
`timeout: 0` disables, caller signal abort not retried.

## Files to Change
- `client/src/core/HttpClient.js` — timeout signals and the retry loop.
- `client/src/core/RetryPolicy.js` — (optional) retry decisions and backoff.
- `client/specs/core/HttpClient_spec.js`, `client/specs/core/RetryPolicy_spec.js` — specs.
