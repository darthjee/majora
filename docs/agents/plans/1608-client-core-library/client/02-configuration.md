# Configuration
Create `client/src/core/Config.js`, resolving and validating
`{ baseUrl, token, timeout, retries, fetch, allowInsecureHttp }` with an injectable `env`
(defaulting to `process.env`) so specs never touch the real environment.

- `baseUrl` falls back to `env.MAJORA_URL`, `token` to `env.MAJORA_TOKEN`.
- `baseUrl`: strip trailing slash(es); must parse with `new URL()` as an absolute `http:` or
  `https:` URL, else `ConfigurationError`.
- `http:` is rejected with `ConfigurationError` unless the hostname is `localhost` or
  `127.0.0.1`, or `allowInsecureHttp === true`.
- Missing/empty `token` → `ConfigurationError`. The error message must not include the token.
- `timeout` defaults to `30000` (ms, `0` disables); `retries` defaults to `2` (`0` disables);
  reject negative or non-integer values with `ConfigurationError`.
- `fetch` defaults to `globalThis.fetch`; a non-function → `ConfigurationError`.
- Expose resolved, frozen values (`baseUrl`, `token`, `timeout`, `retries`, `fetch`).

Specs in `client/specs/core/Config_spec.js`: explicit options win over env, env fallback, each
validation failure, the http exceptions (localhost, 127.0.0.1, `allowInsecureHttp`, a
docker-compose hostname rejected without it), trailing-slash normalization, defaults.

## Files to Change
- `client/src/core/Config.js` — configuration resolution and validation.
- `client/specs/core/Config_spec.js` — specs.
