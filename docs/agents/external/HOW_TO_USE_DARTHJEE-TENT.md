# How to Use darthjee/tent

**Minimum version:** [0.9.1](https://github.com/darthjee/tent/releases/tag/0.9.1)

[Tent](https://github.com/darthjee/tent) is a PHP-based reverse proxy and static file server distributed as a Docker image. It acts as the single entry point for applications that combine a backend API and a frontend — routing, caching, and serving files through a simple PHP configuration layer.

---

## Table of Contents

| Page | Covers |
|------|--------|
| [Setup](tent/setup.md) | Quick Start with Docker, configuration folder layout (`configure.php`, `rules/`), and how to define rules with `Configuration::buildRule()` (matcher types). |
| [Request Handlers](tent/request-handlers.md) | `default_proxy`, `proxy`, and `static` handlers, their options, and which one to use. |
| [Host Header and Why It Matters](tent/host-header.md) | Why the `Host` header must be rewritten when proxying, and how `default_proxy` handles it automatically. |
| [Middlewares](tent/middlewares.md) | `FileCacheMiddleware`, `CacheCleanupMiddleware`, `SetHeadersMiddleware`, `RenameHeaderMiddleware`, `SetPathMiddleware`, `RedirectMiddleware`. |
| [Cache Configuration](tent/cache-configuration.md) | Enabling/disabling cache, custom cache location and codes, `skip_cache_header`, and manual `FileCacheMiddleware` setup. |
| [Dev Mode and Static Files](tent/dev-mode-and-static.md) | Flipping between a live dev-server proxy and pre-built static files via an env var; serving committed static assets. |
| [Complete Example Layout](tent/complete-example.md) | A full project layout combining `docker-compose.yml`, `configure.php`, and rule files. |
| [Extending Tent](tent/extending.md) | Mounting a `loader.php` to add custom matcher/middleware/handler classes without forking Tent. |
| [Reference](tent/reference.md) | Container paths, handler classes, middleware classes, cache matchers, and rule matcher types. |

---

## Quick start

1. Mount `configuration/` and `static/` into the `darthjee/tent` image and define rules — see [Setup](tent/setup.md).
2. Pick the right [Request Handler](tent/request-handlers.md) for each rule (`default_proxy` in almost all cases).
3. Understand why `default_proxy` fixes the [Host header](tent/host-header.md) automatically.
4. Need custom header/path rewriting or cache invalidation? See [Middlewares](tent/middlewares.md).
5. Tuning what gets cached, or bypassing cache per-request? See [Cache Configuration](tent/cache-configuration.md).
6. Wiring a JS frontend's dev server vs. its production build? See [Dev Mode and Static Files](tent/dev-mode-and-static.md).
7. For container paths, class names, and matcher types, see [Reference](tent/reference.md).
