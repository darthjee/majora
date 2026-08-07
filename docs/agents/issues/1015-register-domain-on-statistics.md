# Issue: Register domain on statistics

## Description
Statistics sessions (`statistics.Session`) currently track the visitor's IP, authenticated user, and a cookie-borne token — but not which domain (game domain) the visit came in on. This issue adds domain tracking to statistics sessions, and extracts the domain concept (`games.GameDomain`/`games.GameDomainGroup`) out of the `games` app into a new standalone `domains` app, since it's no longer games-specific (an upcoming STL/3D-file repository app will need it too).

## Problem
- Statistics data can't currently be segmented per domain/game, since `statistics.Session` has no domain reference at all.
- The domain concept (`GameDomain`/`GameDomainGroup`) currently lives inside the `games` app, which would force `statistics` (and any future app, like the planned STL repository) to depend on `games` just to reference "which domain a request came from" — the wrong coupling direction for a cross-cutting concept.

## Expected Behavior
- `statistics.Session` gains a nullable `domain` field, a foreign key to the new `domains.Domain` model.
- When a session is created/loaded, the request's host is resolved to a `domains.Domain` (mirroring the existing `request.get_host().split(':')[0].lower()` → `Domain.objects.filter(domain=...)` pattern used elsewhere); if unrecognized, `domain` stays `None` — session creation is never blocked.
- A session lookup by cookie token also filters by domain (`Session.objects.filter(token=token, domain=domain)`).
- If a session's stored domain doesn't match the current request's resolved domain, it's treated as a mismatch and a new session is created — the same handling that already exists for IP mismatches.

## Solution

### Domain module extraction
`games.GameDomain`/`games.GameDomainGroup` move into a new standalone app, `domains`, as `Domain` and `DomainGroup`:
- Same fields/validators/`HistoricalRecords` behavior as today.
- `games.Game` keeps its M2M to the relocated group model; the field name on `Game` stays `game_domain_groups`, pointing at `domains.DomainGroup`.
- Migrated via `migrations.SeparateDatabaseAndState` (state-only `CreateModel`/`DeleteModel` across the two apps, no destructive `database_operations`) so existing rows survive the move intact.
- **Historical/audit data is wiped, not migrated**: `GameDomain`/`GameDomainGroup` use `HistoricalRecords(app='versioning', ...)`, so their audit-trail models (`HistoricalGameDomain`, `HistoricalGameDomainGroup`) actually live in the `versioning` app, not `games`. Rather than a careful state-only FK retarget to preserve that history, the `versioning` migration simply drops `HistoricalGameDomain`/`HistoricalGameDomainGroup` and the `domains` app's own migration creates fresh `HistoricalDomain`/`HistoricalDomainGroup` tables (starting empty) — losing past audit trail for these two models is acceptable here. Note this only wipes *history*; the live `GameDomain`/`GameDomainGroup` → `Domain`/`DomainGroup` row data itself is still preserved via the `SeparateDatabaseAndState` move above.
- **CSRF-origins middleware moves too**: `games.middleware.GameDomainCsrfOriginsMiddleware` exists only because `GameDomain` used to live in `games` — its logic (building trusted CSRF origins from registered domains) is domain logic, not games logic. It moves to `domains/middleware.py`, renamed `DomainCsrfOriginsMiddleware`, with the `MIDDLEWARE` entry in `majora_project/settings.py` updated to `domains.middleware.DomainCsrfOriginsMiddleware`.
- Call sites switching their imports from `games.models`/`games.middleware` to `domains.models`/`domains.middleware`: `DomainGamesCache`, `RegisteredDomainsCache`, `games_list.py`, `games/admin.py` (moves its `admin.site.register(GameDomainGroup)`/`admin.site.register(GameDomain)` calls to `domains/admin.py`), and the `MIDDLEWARE` setting above.
- `majora_project/settings.py`'s comment referencing `GameDomain`/`GameDomainGroup` (near `ENABLE_GAMES_PER_DOMAIN`) is updated to say `domains.Domain`/`domains.DomainGroup` for accuracy.

### Data model
Add a `domain` field to `statistics.Session`:
```python
domain = models.ForeignKey(
    'domains.Domain', null=True, blank=True,
    on_delete=models.SET_NULL, related_name='statistics_sessions',
)
```
Nullable because a request's host may not resolve to any registered `Domain`; `on_delete=SET_NULL` mirrors the existing `user` FK on `Session`.

### Session creation & mismatch handling
Extend `_load_or_create_session` to also compare domain, alongside the existing IP check:
```python
def _load_or_create_session(self, request, ip, domain):
    session = self._session_from_cookie(request)

    if session is not None and session.ip == ip and session.domain == domain:
        session.save(update_fields=['last_seen_at'])
        return session

    user = request.user if request.user.is_authenticated else None
    return Session.objects.create(ip=ip, user=user, domain=domain)
```

### Token lookup filter
`_session_from_cookie` filters by both token and domain directly at the query level:
```python
def _session_from_cookie(self, request, domain):
    ...
    return Session.objects.filter(token=token, domain=domain).first()
```
`token` stays globally unique (`unique=True`) — collision risk with a `secrets.token_urlsafe(32)` value is cryptographically negligible, so there's no need to scope uniqueness to `(token, domain)`.

### Migration/backfill
No backfill — `domain` is nullable, so existing rows simply get `domain=NULL`; there's nothing to reconstruct from since `Session` never stored the request host historically. `statistics`'s migration adding this field declares a `dependencies` entry on the `domains` app's initial migration.

### API/Admin surface
No changes needed — `statistics` has no `serializers.py`/`views.py`/`urls.py` (`Session` is never exposed via API), and `statistics/admin.py`'s `ReadOnlySessionAdmin` has no explicit `list_display`/`fields`/`readonly_fields`, so the new field surfaces automatically.

## Benefits
- Enables domain-scoped analysis of statistics data (e.g. per-game or per-site breakdowns).
- Removes the `games` → `statistics` coupling problem before it starts, and gives the upcoming STL repository app a clean, dependency-light way to reference domains too.
- Reuses the existing IP-mismatch anomaly handling pattern for domain mismatches, keeping the session-rotation logic consistent rather than introducing a new rule.
