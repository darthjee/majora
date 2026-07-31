# Injection Risks

## Django ORM

- Avoid passing user-controlled data directly into `filter()` keyword arguments without validation (e.g. `filter(**request.query_params)` is dangerous).
- Never use `extra()`, `RawSQL()`, or `raw()` with unsanitised user input.
- URL-captured values (e.g. `<slug>`, `<id>`) must be constrained by the URL pattern type (e.g. `<int:id>`, `<slug:slug>`) — do not rely on downstream casting alone.

## PHP Proxy (Tent)

- Proxy rule files (`proxy/*/rules/*.php`) must not interpolate HTTP request data (headers, query params, body) into shell commands, `exec()`, `eval()`, `system()`, or dynamic `include`/`require` calls.
- Host-based routing in `configure.php` must use exact-match comparisons, not substring matches, to prevent header injection attacks via the `Host` header.
