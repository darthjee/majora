# Plan: Backend: GameDocumentPage model and read endpoints

Issue: [1125-backend--gamedocumentpage-model-and-read-endpoints.md](../../issues/1125-backend--gamedocumentpage-model-and-read-endpoints.md)

## Overview

Add a `GameDocumentPage` model (an ordered child of `GameDocument`) and two read-only endpoints — a public `pages.json` and a dm/admin-only `pages/all.json` — that serve document content page by page, reusing the existing pagination engine. This is entirely backend-scoped; no other agent has work on this sub-issue.

## Context

`GameDocument` currently only holds a single flat `description` text field. This issue splits document content into ordered `GameDocumentPage` rows so large documents can be paged through, without changing anything about how `GameDocument` itself works. Create/edit of pages is explicitly out of scope (a separate, still-vague sub-issue of parent #1124).

The closest existing precedent is the document-scoped `files`/`files_all` pair (`backend/games/views/games/game_document_files.py` / `game_document_files_all.py`), not the top-level `documents`/`documents_all` pair — this plan mirrors that pattern almost verbatim.

## Implementation Steps

### Step 1 — `GameDocumentPage` model

Create `backend/games/models/game/game_document_page.py`:

```python
"""GameDocumentPage model for Majora RPG Campaign Management System."""

from django.db import models

from games.models.game.game_document import GameDocument


class GameDocumentPage(models.Model):
    """Model representing a single ordered page of a game document's content."""

    game_document = models.ForeignKey(
        GameDocument, on_delete=models.CASCADE, related_name='pages',
    )
    content = models.TextField(blank=True, default='')
    order = models.PositiveIntegerField()

    class Meta:
        """Metadata for the GameDocumentPage model."""

        ordering = ['game_document', 'order']

    def __str__(self):
        """Return string representation of the game document page."""
        return f'{self.game_document.name} — page {self.order}'
```

No `unique_together`/DB-level uniqueness on `(game_document, order)` — matches the "no DB-level uniqueness constraint" decision in the issue; app code (a later create/edit sub-issue) is responsible for keeping values sane. No `HistoricalRecords` — `GameDocumentFile` (the closest sibling) doesn't version either, and versioning is out of scope for a read-only sub-issue.

Register in `backend/games/models/__init__.py`, alphabetized alongside the other `GameDocument*` imports/`__all__` entries (after `GameDocumentFilePhoto`, before `GameDocumentPhoto`... actually alphabetically `GameDocumentPage` sorts before `GameDocumentPhoto` and after `GameDocumentFilePhoto`).

### Step 2 — Migration

Run `poetry run python manage.py makemigrations games` inside the backend container (per `AGENTS.md`, never invoke `poetry` on the host) to generate `backend/games/migrations/0098_gamedocumentpage.py` (next number after `0097_alter_characterlink_url_alter_gamelink_url.py`). Verify the generated migration matches: `BigAutoField` id, FK to `GameDocument` with `CASCADE`, `content` TextField, `order` PositiveIntegerField, `options={'ordering': ['game_document', 'order']}` — consistent with `0096_characterfaction.py`'s shape for a new model.

### Step 3 — Serializer

Create `backend/games/serializers/games/documents/game_document_page_list.py`:

```python
"""GameDocumentPage list serializer for the games app."""

from rest_framework import serializers

from games.models import GameDocumentPage


class GameDocumentPageListSerializer(serializers.ModelSerializer):
    """Serializer for game document page list items."""

    class Meta:
        """Metadata for the GameDocumentPageListSerializer."""

        model = GameDocumentPage
        fields = ['id', 'content', 'order']
```

Only one serializer is needed — unlike `GameDocument` itself, a page has no `hidden` field of its own (visibility is gated entirely at the parent-document level), so both `pages.json` and `pages/all.json` return identical field shapes, exactly like `GameDocumentFileSerializer` is shared by both `game_document_files` and `game_document_files_all`.

Register `GameDocumentPageListSerializer` in `backend/games/serializers/__init__.py`, alphabetized alongside the other `GameDocument*` serializer imports/`__all__` entries.

### Step 4 — Views

Create `backend/games/views/games/game_document_pages.py`:

```python
"""View for the game document pages-list endpoint."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from accounts.authentication import CookieTokenAuthentication

from ...models import Game
from ...serializers import GameDocumentPageListSerializer
from ..common import paginated_list_response


@api_view(['GET'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: GET is intentionally public (hidden documents excluded below).
@permission_classes([AllowAny])
def game_document_pages(request, game_slug, document_id):
    """Return a paginated list of pages for a specific non-hidden game document."""
    game = get_object_or_404(Game, game_slug=game_slug)
    document = get_object_or_404(game.documents.filter(hidden=False), id=document_id)
    pages = document.pages.all()
    return paginated_list_response(request, pages, GameDocumentPageListSerializer)
```

Create `backend/games/views/games/game_document_pages_all.py`:

```python
"""View for the game document pages/all.json endpoint — DM/superuser only."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from accounts.authentication import CookieTokenAuthentication

from ...models import Game
from ...serializers import GameDocumentPageListSerializer
from ..common import check_game_edit, paginated_list_response


@api_view(['GET'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: authorization for this whole endpoint is enforced inline via
# EndpointPermission.check(), so unauthenticated/non-DM callers get the app's own
# 401/403 payload instead of DRF's default.
@permission_classes([AllowAny])
def game_document_pages_all(request, game_slug, document_id):
    """Return all pages (including for hidden documents) — DM/superuser only."""
    game = get_object_or_404(Game, game_slug=game_slug)
    error_response = check_game_edit(request, game)
    if error_response:
        return error_response
    document = get_object_or_404(game.documents.all(), id=document_id)
    pages = document.pages.all()
    response = paginated_list_response(request, pages, GameDocumentPageListSerializer)
    response['X-Skip-Cache'] = 'true'
    return response
```

Register both in `backend/games/views/games/__init__.py` (or wherever `game_document_files`/`game_document_files_all` are re-exported from).

`per_page=1` needs no special handling in either view — `Paginator`/`paginated_list_response` (`backend/games/paginator.py`, `backend/games/views/common.py`) already returns the total page count via the standard `pages` response header regardless of `per_page` value.

### Step 5 — URL registration

In `backend/games/urls/games.py`, add two `path()` entries immediately after the existing `files`/`files/all` pair (around line 94), following the exact same shape:

```python
    path(
        'games/<slug:game_slug>/documents/<int:document_id>/pages.json',
        views.game_document_pages,
        name='game-document-pages',
    ),
    path(
        'games/<slug:game_slug>/documents/<int:document_id>/pages/all.json',
        views.game_document_pages_all,
        name='game-document-pages-all',
    ),
```

### Step 6 — Tests

Add `backend/games/tests/models/game/game_document_page_test.py` (model creation, `__str__`, default ordering) and `backend/games/tests/views/games/game_document_pages_test.py` / `game_document_pages_all_test.py`, mirroring `game_document_files_test.py` / `game_document_files_all_test.py`:
- Regular endpoint: 200 with paginated pages for a visible document, 404 for a hidden document, 404 for a non-existent document/game.
- `_all` endpoint: 200 with pages for both visible and hidden documents when called as dm/admin, 401/403 for anonymous/non-privileged callers, `X-Skip-Cache: true` header present.
- Pagination: default `per_page` returns multiple pages' worth of `GameDocumentPage` rows correctly ordered by `order`; `per_page=1&page=N` returns exactly one item and a `pages` header equal to the document's total page count.

## Files to Change

- `backend/games/models/game/game_document_page.py` — new `GameDocumentPage` model
- `backend/games/models/__init__.py` — register the new model
- `backend/games/migrations/0098_gamedocumentpage.py` — migration (generated, not hand-written)
- `backend/games/serializers/games/documents/game_document_page_list.py` — new `GameDocumentPageListSerializer`
- `backend/games/serializers/__init__.py` — register the new serializer
- `backend/games/views/games/game_document_pages.py` — new public list view
- `backend/games/views/games/game_document_pages_all.py` — new dm/admin-only list view
- `backend/games/views/games/__init__.py` — register the two new views
- `backend/games/urls/games.py` — register the two new routes
- `backend/games/tests/models/game/game_document_page_test.py` — new model tests
- `backend/games/tests/views/games/game_document_pages_test.py` — new view tests
- `backend/games/tests/views/games/game_document_pages_all_test.py` — new view tests

## CI Checks

- `backend`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_rest`) — covers the two new view test files
- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_all`) — covers the new model test file
- `backend`: `poetry run ruff check .` (CI job: `checks`)
- `backend`: `bin/reports.sh ci` (CI job: `checks`, complexity check)

Run all backend commands via `docker-compose`/`make tests` per `AGENTS.md`, never directly on the host.

## Notes

- `GameDocumentFile` extends a shared `BaseFile` abstract model (for upload/ready-state handling); `GameDocumentPage` does not need this — it has no file/upload concept, so it extends `models.Model` directly, same as `GameDocument` itself.
- No `HistoricalRecords`/versioning on `GameDocumentPage` for this sub-issue — revisit if the later edit/create sub-issue needs it.
- Ordering uniqueness enforcement (renumbering on insert/reorder) is deliberately deferred to the edit/create sub-issue; this plan only needs `Meta.ordering` for stable read-order.
- Confirm the exact next migration number (`0098_...`) at implementation time — trivial if another migration has landed on `main` since this plan was written.
