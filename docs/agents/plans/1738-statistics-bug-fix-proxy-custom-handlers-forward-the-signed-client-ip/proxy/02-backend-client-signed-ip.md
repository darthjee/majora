# BackendClient sets the signed client IP

`BackendClient` takes the proxy secret (new constructor argument, default `''`) and, on every
`request()`:

1. filters the incoming headers as today (`ForwardedHeaderFilter` keeps excluding both
   headers);
2. removes any `X-Forwarded-For`/`X-Proxy-Secret` (case-insensitively) — defensive, in case a
   caller passes either through `$extraAllowedHeaders`;
3. sets the helper's headers from the remote address and the secret;
4. applies `$overrideHeaders` last, as today.

Read the remote address from `$_SERVER['REMOTE_ADDR']` (default `''`) behind a seam tests can
control (e.g. an optional constructor argument or a protected method), so tests don't depend on
the superglobal.

Constructor order: keep `$host, $httpClient` first so existing callers stay valid; append
`string $secret=''`.

Update the class docblock and `request()`'s numbered steps.

## Files to Change

- `proxy/extension/lib/support/BackendClient.php` — secret argument, header injection.
- `proxy/extension/tests/support/BackendClientTest.php` — `X-Forwarded-For` set from the remote
  address; `X-Proxy-Secret` present with a secret and absent without; client-supplied values of
  both (mixed casing) dropped, including via `$extraAllowedHeaders`; `$overrideHeaders` still
  applied last.
