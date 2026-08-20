# Issue: Add domain configuration

## Problem

When we load a page, regardless of the domain, everything is rendered in the same way, so there is no difference between domains.

## Expected Behavior

When a page loads, the frontend requests `GET /domain/config.json`. The response reflects the current domain's configuration — resolved via `Domain` → `DomainGroup` → `DomainConfiguration` — merged with defaults: a `null` attribute falls back to its default value, and `""` is shown as empty. `navbar-brand`'s title/sub-title reflect the domain group's configured values (or the defaults `Majora`/`RPG` when unset). The favicon is swapped only when a domain-specific one is configured; otherwise the static default `<link>` already in `index.html` is left untouched. A domain with no matching `Domain` row at all (e.g. dev/staging/unexpected hosts) renders with full defaults rather than erroring.

## Solution

We should load, from an endpoint `GET /domain/config.json`, the configuration of the current domain.

### Implementation

We need to have an entity `DomainConfiguration`, related to `DomainGroup` (not `Domain` directly) — mirroring how `Game` already scopes per tenant via `game_domain_groups`/`domain_group` rather than per individual hostname (see `games/caches/domain_games_cache.py`). This means every hostname in a `DomainGroup` automatically shares the same configuration, with no need to configure each hostname separately.

Resolution reuses the existing host → domain lookup pattern already established in `games/caches/domain_games_cache.py`, `games/views/games/games_list.py`, and `statistics/middleware.py` — no new resolution logic needed:

```python
host = request.get_host().split(':')[0].lower()
domain = Domain.objects.filter(domain=host).first()
domain_group = domain.domain_group  # then DomainConfiguration lookup by domain_group
```

(`USE_X_FORWARDED_HOST = True` in `majora_project/settings.py` already makes `get_host()` trustworthy behind the Tent proxy, per the existing comment there.)

When `DomainConfiguration` for the domain group doesn't exist, a default is chosen

When an attribute is null, the default is used (we merge default with domain specific)

**Unregistered domain (no matching `Domain` row at all):** unlike `games/views/games/games_list.py` (which 404s on an unrecognized host via `RegisteredDomainsCache`), `/domain/config.json` falls back to full defaults instead — the endpoint's whole purpose is graceful rendering regardless of domain, so an unrecognized host (dev/staging/unexpected) is treated the same as a recognized domain with no `DomainConfiguration`.

### attributes and default
when value is `null` use default
When value is `""` show `""`

| attribute | default | comment |
| --- | --- | --- |
| favicon | `null` | `null` means "don't touch the favicon" — see "Favicon delivery" below |
| title | Majora | Value shown in `navbar-brand`, replaces the `header.title` i18n key |
| sub-title | RPG | shown in `navbar-brand`'s `<small className="d-block text-muted">`; replaces the `header.subtitle` i18n key; when `""` shows nothing |

### Scope

In scope for this issue:
- `DomainConfiguration` model, related to the existing `DomainGroup` model in `backend/domains/` (see "Implementation" above for why `DomainGroup` rather than `Domain`)
- `GET /domain/config.json` endpoint — public, unauthenticated, no permission checks (everyone should have access), following the `backend/accounts/views/auth/header_status.py` pattern (`@authentication_classes([])`, `@permission_classes([AllowAny])`)
- Default-merge logic (`null` → default, `""` → shown as `""`)
- The three attributes above (`favicon`, `title`, `sub-title`) only — more attributes are future work
- Frontend wiring described in "Frontend integration" below
- Deploy-time linking of a new `domain` static folder, plus its proxy routing and local-dev volume mount (see "Favicon delivery" below)

Explicitly out of scope:
- Any attributes beyond `favicon`/`title`/`sub-title`
- Admin UI for managing `DomainConfiguration` beyond Django admin
- Config caching/invalidation: **not needed** — the config only changes on deployment (or via manual edit outside of a deploy), so no cache-busting mechanism is required

### Alternatives considered

- **Build-time/env-var config baked into the frontend build** — rejected: a single deployment serves multiple domains (that's what `DomainGroup` already models), so per-domain values can't be fixed at build time.
- **Django's built-in `django.contrib.sites` framework** — rejected: majora already has its own custom `Domain`/`DomainGroup` app; introducing `django.contrib.sites` in parallel would be a second, competing multi-site concept for no benefit.
- **Embed config server-side into `index.html`** (avoid a second network round-trip) — ruled out: `index.html` is served as a static file through the PHP Tent proxy (`proxy/*/rules/frontend.php`), not rendered by Django, so there's no request-time hook to inject config into it without restructuring how the frontend is served.
- **Hardcode a domain→config mapping in the frontend bundle** — rejected: defeats the purpose, since config needs to be editable (via Django admin) without a full frontend rebuild+deploy.
- **Have the PHP Tent proxy resolve/inject config instead of a Django endpoint** — rejected: default-merge logic and DB access belong on the Django side where `Domain`/`DomainGroup` already live; the proxy doesn't currently talk to the DB.
- **Chosen approach**: a dedicated `GET /domain/config.json` fetched client-side on bootstrap — fits the existing architecture (static FE serving behind the proxy, DB-backed domain model on the Django side).

### Data model

```python
class DomainConfiguration(models.Model):
    domain_group = models.OneToOneField(
        DomainGroup, on_delete=models.CASCADE, related_name='configuration'
    )
    favicon = models.CharField(max_length=200, null=True, blank=True, default=None)
    title = models.CharField(max_length=200, null=True, blank=True, default=None)
    sub_title = models.CharField(max_length=200, null=True, blank=True, default=None)
    history = HistoricalRecords(app='versioning', user_db_constraint=False)
```

- `OneToOneField` to `DomainGroup` — one configuration per tenant.
- `null=True` on the `CharField`s is a deliberate deviation from the usual Django convention (normally `blank=''` only) — required here to represent the three-state semantics from the spec: `null` → use default, `""` → show empty, real value → use it.
- The per-attribute *effective* default (`null` for favicon, `"Majora"`/`"RPG"` for title/sub-title) is applied in the merge step, not the model.

**Migration: retire `Domain.title` in favor of this model.** `Domain.title` (on `Domain`, not `DomainGroup`) is currently unused anywhere in the codebase (no view/serializer/admin reference beyond the bare `admin.site.register(Domain)`), and duplicates the new `DomainConfiguration.title` concept now that configuration is scoped to `DomainGroup`. Plan:
1. Data migration: for each `DomainGroup`, create a `DomainConfiguration` row; set `title` to the first non-empty `Domain.title` found among that group's `domains` (deterministic ordering, e.g. by `id`), or leave `title` as `None` if none of the group's domains have a title set.
2. Schema migration: drop the `Domain.title` field.

### Favicon delivery

Per-domain favicons are uploaded manually to the server (not through a new upload UI), following the same deploy-time linking pattern already used for `photos`/`files` in `.circleci/config.yml` (`link_photos`, `link_files` jobs, using `bin/deploy_frontend.sh link` with `SOURCE=$REMOTE_HOME/<name> DEPLOY_PATH=<name>`):

- A new `link_domain` CircleCI job is added, symlinking a persistent `$REMOTE_HOME/domain` directory into each release as `domain/` (`SOURCE=$REMOTE_HOME/domain DEPLOY_PATH=domain bin/deploy_frontend.sh link`), wired into the `release` job's `requires` list like the existing link jobs.
- Favicon files are uploaded by hand into `$REMOTE_HOME/domain` on the server; the deploy process just keeps the symlink current, so uploads persist across releases.
- The `favicon` attribute's value, when set, is the resulting static path under `/domain/...` (naming convention TBD — e.g. `/domain/<domain>/favicon.png` — to be settled during implementation/planning).
- **Default is `null`, not a path.** Unlike `title`/`sub-title`, `favicon`'s default deliberately stays `null` — this means the backend never needs to know the frontend's built favicon path (the concern originally flagged on this issue). On the frontend, a `null` favicon is a no-op: the static `<link rel="icon" href="/assets/images/favicon.png">` already in `index.html` is left untouched. Only a non-null value (a real per-domain override) makes the frontend rewrite the `<link>` tag's `href` at runtime. This is safe because `index.html` itself isn't going away — unlike `title`/`sub-title`, whose static i18n fallback is being removed, so they need real string defaults instead.

**Proxy routing** — a new rule, mirroring `proxy/prod_configuration/rules/photos.php` / `proxy/dev_configuration/rules/photos.php` almost exactly: both existing files are a single `Configuration::buildRule()` call with `handler.type = 'static'`, matching `GET` + `begins_with '/photos'`, plus a `CacheControlMiddleware`. Add `proxy/{prod,dev}_configuration/rules/domain.php` following the same shape, matching `begins_with '/domain'`, and wire it into `configure.php` (both prod and dev) via `require_once __DIR__ . '/rules/domain.php';` alongside the existing `photos.php`/`files.php` requires, before the catch-all redirect. Unlike `photos`/`files`, no `uploads.php`/`delete.php`/`cache_cleanup/*.php` wiring is needed — favicons are dropped in manually, never through the app's upload/delete API, and no backend JSON response embeds a favicon path that would need cache invalidation.

**Local dev** — add `./docker_volumes/domain:/var/www/html/domain` to the `majora_proxy` service's volumes in `docker-compose.yml`, alongside the existing `./docker_volumes/photos:/var/www/html/photos` / `./docker_volumes/files:/var/www/html/files` mounts, and add `docker_volumes/domain/` to `.gitignore` alongside the matching `photos`/`files` entries. No Makefile/script changes needed — like `photos`/`files`, the directory is created on first `docker-compose up` if it doesn't already exist.

### Frontend integration

`title`/`sub-title` are rendered today in `frontend/assets/js/components/common/header/helpers/HeaderHelper.jsx` (`HeaderHelper.render()`), sourced from the i18n keys `header.title`/`header.subtitle` via `Translator.t(...)`:

```jsx
<Navbar.Brand href="#/">
  {Translator.t('header.title')}
  <small className="d-block text-muted">{Translator.t('header.subtitle')}</small>
</Navbar.Brand>
```

Once domain configuration is wired in, this component reads `title`/`sub-title` from the loaded `DomainConfiguration` instead. Since these values become domain-driven config rather than translated strings, the `header.title` and `header.subtitle` i18n keys are removed outright from all `frontend/assets/i18n/*/common.yaml` files — `HeaderHelper.jsx` is their only consumer, so no deprecation period is needed.

**Browser tab title too.** `frontend/index.html:7` has a separate, static `<title>Majora</title>` — the browser tab title, distinct from the navbar-brand `header.title` key above. This is also domain-configured: once `/domain/config.json` is loaded, frontend JS sets `document.title` from the same `DomainConfiguration.title` value, keeping the tab title and the navbar-brand in sync.

### Testing strategy

- **Backend**: model/merge-logic tests for `DomainConfiguration` (null → default, `""` → empty, real value → used); endpoint tests for `/domain/config.json` covering a domain with configuration, a domain group with no `DomainConfiguration` row, and an unregistered domain (falls back to full defaults); a data-migration test verifying the `Domain.title` → `DomainConfiguration.title` backfill picks the first non-empty title per group.
- **Frontend**: `HeaderHelper` Jasmine spec covering title/sub-title/favicon rendering driven by the loaded config, including the `""` (blank sub-title) and `null` (favicon no-op, existing `<link>`/`<title>` untouched) cases.
- No new test tooling — reuses this repo's existing pytest/Jasmine setups.

## Benefits

- Enables true per-domain-group branding (title, sub-title, favicon) without separate deployments or per-tenant code branching.
- Replaces hardcoded/i18n-based branding strings with tenant-configurable data, editable via Django admin.
- Lays an extensible, precedent-following foundation (mirrors the existing `Domain`/`DomainGroup`/`Game` scoping pattern) for future per-domain attributes.
- Cleans up the unused, duplicate `Domain.title` field.

## Future

Other fields will be added in the future.

### Extensibility approach

Considered a single JSON field (`config = JSONField(default=dict)` merged against a `DEFAULTS` dict in code) as a way to avoid a migration per new attribute, versus keeping discrete columns (`favicon`, `title`, `sub_title`) as drafted in "Data model" above. **Decision: keep discrete columns** — matches the existing `Domain`/`DomainGroup` style in this codebase, keeps Django admin editing type-safe and discoverable, and the accepted trade-off is that each future attribute needs its own migration + serializer/view/merge-logic update, same as any other model field addition in this app.
