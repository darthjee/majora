# Documentation

Document that custom handlers send the signed client IP themselves:

- `SetClientIpMiddleware`'s docblock: mention that the custom handlers apply the same headers
  through `BackendClient` (the helper), since their rules don't run the middleware.
- The rule-file header comments of `uploads.php`, `delete.php` and `cache.php` (prod and dev):
  note the `secret` attribute.
- The proxy architecture docs under `docs/agents/architecture/` (grep for the custom handlers
  and the client IP / proxy secret): add the rule that every backend call made by a handler
  carries `X-Forwarded-For` and `X-Proxy-Secret`, and that a new handler must pass `secret`.

## Files to Change

- `proxy/extension/lib/middlewares/SetClientIpMiddleware.php` — docblock.
- `proxy/prod_configuration/rules/{uploads,delete,cache}.php`,
  `proxy/dev_configuration/rules/{uploads,delete,cache}.php` — header comments.
- `docs/agents/architecture/` proxy docs — the client-IP rule for handlers.
