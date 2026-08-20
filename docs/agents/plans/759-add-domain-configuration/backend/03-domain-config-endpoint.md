# `GET /domain/config.json` endpoint

Follow the existing `accounts` app structure as the precedent (`accounts/views/auth/header_status.py` + `accounts/urls/auth.py`), mirrored inside `domains/`:

```python
@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def config(request):
    host = request.get_host().split(':')[0].lower()
    domain = Domain.objects.filter(domain=host).first()
    domain_configuration = (
        getattr(domain.domain_group, 'configuration', None) if domain else None
    )
    return Response(_merge_with_defaults(domain_configuration))
```

(reusing the exact host-resolution one-liner already established in `games/caches/domain_games_cache.py`, `games/views/games/games_list.py`, and `statistics/middleware.py` — no new resolution logic).

Merge logic (`_merge_with_defaults`), keyed by the response shape from [plan.md](../plan.md)'s "Shared contracts":

- `favicon`: `domain_configuration.favicon if domain_configuration else None` (default is `None` — never a path).
- `title`: `domain_configuration.title` when set and not `None`, else `"Majora"`.
- `sub_title`: `domain_configuration.sub_title` when set and not `None`, else `"RPG"`.
- `""` on any field passes through unchanged (Django's `CharField(null=True)` already distinguishes `None` from `""`, so no extra handling is needed beyond "is it `None`?").

No matching `Domain` row (unregistered host) and no `DomainConfiguration` row for an otherwise-known `DomainGroup` both fall through to the same all-defaults response — never a 404 (see [plan.md](../plan.md) and the issue's "Unregistered domain" note).

Do **not** wrap the response in `skip_cache`/set `X-Skip-Cache` — this endpoint is meant to be cacheable.

Wire the route: add a `path('domain/config.json', views.config, name='domain-config')` to a new `domains/urls.py` (or `domains/urls/__init__.py`, matching whichever shape `accounts` uses once step 01 lands), and add `path('', include('domains.urls'))` to `backend/majora_project/urls.py`.

## Files to Change

- `backend/domains/views/__init__.py` / `backend/domains/views/config.py` — new view
- `backend/domains/urls.py` (or `backend/domains/urls/__init__.py`) — new route
- `backend/majora_project/urls.py` — `include('domains.urls')`
