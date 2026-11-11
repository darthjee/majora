# Extract the client-IP header helper

Move the header logic of `SetClientIpMiddleware` into a small support class (e.g.
`Tent\RequestHandlers\ClientIpHeaders` in `proxy/extension/lib/support/ClientIpHeaders.php`, or
whichever namespace fits both callers), so the middleware and `BackendClient` share one
implementation:

- the two header-name constants (`X-Forwarded-For`, `X-Proxy-Secret`);
- a method that, given a remote address and a secret, returns the headers to set
  (`X-Forwarded-For` always; `X-Proxy-Secret` only when the secret is non-empty);
- a method that removes both names case-insensitively from a header array (for
  `BackendClient`), if it reads cleaner than reusing `BackendClient::withoutHeader`.

`SetClientIpMiddleware` keeps its public API (`build(['secret' => ...])`, `processRequest`) and
behaviour, delegating to the helper. Register the new file in `proxy/extension/loader.php`
before both users.

## Files to Change

- `proxy/extension/lib/support/ClientIpHeaders.php` — new helper.
- `proxy/extension/lib/middlewares/SetClientIpMiddleware.php` — delegate to the helper.
- `proxy/extension/loader.php` — `require_once` the helper.
- `proxy/extension/tests/support/ClientIpHeadersTest.php` — new: header set with and without a
  secret, empty remote address.
- `proxy/extension/tests/middlewares/SetClientIpMiddlewareTest.php` — must still pass unchanged.
