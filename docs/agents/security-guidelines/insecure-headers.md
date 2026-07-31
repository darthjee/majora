# Insecure Headers

- API responses should not strip security headers that Django or Tent adds by default (e.g. `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`).
- Tent proxy rules must not override or remove security headers on proxied responses. Verify that `ProxyRule` / middleware chains do not call any header-stripping method on the response from Django.
- If a view sets `Access-Control-Allow-Origin: *`, flag it for review — CORS wildcards are acceptable only for fully public, read-only, non-cookie-authenticated endpoints.
