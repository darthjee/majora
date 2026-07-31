# Backend (backend/)

All Django source code lives under `backend/`. The backend owns data and business logic.

## majora_project/
Django project package: `settings.py`, root `urls.py`, `wsgi.py`. Entry point for the Django application.

## games/
Core Django app containing domain models, REST views, and serializers for RPG campaign data.

- `models/` — Domain models (see AGENTS.md for current list).
- `views/` — Function-based API views using `@api_view` (one file per view/route).
- `serializers/` — DRF serializers (one class per file).
- `paginator.py` — Custom pagination for list endpoints.
- `urls.py`, `migrations/`, `tests/`, `admin.py`.

Authoritative sources: `backend/games/urls.py` and `backend/games/models/`.

## accounts/
Account/authentication app — every `/users/*.json` endpoint (login, logout, register, status, account management, password reset).

Key files:
- `models/` — `UserProfile`, `PasswordResetToken` (table names preserved for migration compatibility).
- `views/auth/`, `views/password_reset/`
- `serializers/auth/`
- `authentication.py` — `CookieTokenAuthentication`
- `urls.py`, `templates/accounts/`, `migrations/`, `tests/`.

## versioning/
Change-history infrastructure wrapping `django-simple-history`. Tracks full snapshots of saves/deletes for many `games` models; history tables are placed under `versioning/migrations/`. History is exposed only via Django Admin; no API endpoints are introduced by versioning.
