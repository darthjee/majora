# Backend Plan: Add session messages

Main plan: [plan.md](plan.md)

## Shared contracts

- Produces the `GET`/`POST /games/<game_slug>/sessions/<session_id>/messages.json`
  endpoint and its payload/header shape — see [plan.md](plan.md)'s "Shared contracts" for
  the exact contract.
- Depends on #528's `UserProfile.email_hash` and `Settings.gravatar_base_url()` already
  existing on `main` before this work starts.

## Implementation Steps

### Step 1 — `GravatarUrlBuilder` + refactor `MyAccountDetailSerializer`

Add `backend/games/gravatar.py` (a top-level single-purpose module, matching
`settings.py`/`paginator.py`/`permissions.py` in this app):

```python
"""Gravatar avatar URL construction for the games app."""

from .settings import Settings


class GravatarUrlBuilder:
    """Builds a Gravatar avatar URL from a user's precomputed email hash."""

    @staticmethod
    def build(email_hash):
        """Return the Gravatar avatar URL for `email_hash`, or None if there's no hash."""
        if not email_hash:
            return None
        return f'{Settings.gravatar_base_url()}{email_hash}'
```

Update `backend/games/serializers/auth/my_account_detail.py` (from #528) to use it instead
of building the URL inline:

```python
from games.gravatar import GravatarUrlBuilder
...
    def get_avatar_url(self, user):
        profile, _ = UserProfile.objects.get_or_create(user=user)
        return GravatarUrlBuilder.build(profile.email_hash)
```

### Step 2 — `GameSessionMessage` model

Add `backend/games/models/game/game_session_message.py` (co-located with
`game_session.py`/`player.py`/`game_master.py`):

```python
"""GameSessionMessage model for Majora RPG Campaign Management System."""

from django.contrib.auth.models import User
from django.db import models


class GameSessionMessage(models.Model):
    """Model representing a single chat message posted to a game session."""

    session = models.ForeignKey(
        'games.GameSession', on_delete=models.CASCADE, related_name='messages',
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='session_messages')
    player = models.ForeignKey(
        'games.Player', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='session_messages',
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        """Metadata for the GameSessionMessage model."""

        ordering = ['-id']

    def __str__(self):
        """Return string representation of the session message."""
        return f'GameSessionMessage(session={self.session_id}, user={self.user.username})'
```

`player` is set by the create-view (Step 5) only when the poster is a player of the game
and not its DM — the model itself stays agnostic of who sets it. Register in
`backend/games/models/__init__.py` alongside `GameSession`/`Player`/`GameMaster`.

Migration: `backend/games/migrations/00XX_gamesessionmessage.py` (check the latest number
under `backend/games/migrations/` at implementation time — depends on whatever #528's
migration lands as, plus any migrations between now and then).

### Step 3 — Cursor pagination

Add `backend/games/session_message_paginator.py` (new, does not extend the existing
page-number `Paginator` — a genuinely different pagination style, per the issue):

```python
"""Cursor-style paginator for session messages, keyed by NEXT-ENTRY-ID."""

PAGE_SIZE = 20


class SessionMessagePaginator:
    """Paginates a GameSessionMessage queryset using an id cursor."""

    def __init__(self, request, queryset):
        """Initialise with the incoming request and the full (already-ordered) queryset."""
        self.request = request
        self.queryset = queryset

    def paginate(self):
        """Return (page, headers) for the current page."""
        queryset = self.queryset
        cursor = self._next_entry_id()
        if cursor is not None:
            queryset = queryset.filter(id__lte=cursor)
        page = list(queryset[:PAGE_SIZE])
        return page, self._headers(page)

    def _next_entry_id(self):
        """Return the `next-entry-id` query param as an int, or None if absent/invalid."""
        raw = self.request.GET.get('next-entry-id')
        try:
            return int(raw)
        except (TypeError, ValueError):
            return None

    def _headers(self, page):
        """Build the NEXT-ENTRY-ID header: the oldest message's id, or '' if none remain."""
        if not page or not self._has_more(page[-1]):
            return {'NEXT-ENTRY-ID': ''}
        return {'NEXT-ENTRY-ID': str(page[-1].id)}

    def _has_more(self, last_item):
        """Return whether messages older than `last_item` still exist."""
        return self.queryset.filter(id__lt=last_item.id).exists()
```

Note `queryset` passed in must already be `.order_by('-id')` (the model's default
`Meta.ordering` from Step 2 already provides this, so `session.messages.all()` suffices).

### Step 4 — Permission class

Add to `backend/games/permissions.py`, following the existing `_EditPermission` pattern but
with two distinct checks (view vs. create have different rules — unlike every existing
permission class in this file, which has a single `check()`):

```python
class SessionMessagePermission(_EditPermission):
    """Encapsulate the authentication/authorization checks for session messages.

    View is allowed for any player of the session's game, that game's DM, superusers, and
    staff. Create is stricter: only an actual player or DM of the game (no superuser/staff
    bypass), per the issue's explicit permission list.
    """

    @classmethod
    def check_view(cls, request, session):
        """Return an error Response if `request.user` may not view `session`'s messages."""
        unauthenticated = cls._unauthenticated_response(request)
        if unauthenticated:
            return unauthenticated
        if not cls._can_view(request.user, session):
            return cls._forbidden_response()
        return None

    @classmethod
    def check_create(cls, request, session):
        """Return an error Response if `request.user` may not post to `session`."""
        unauthenticated = cls._unauthenticated_response(request)
        if unauthenticated:
            return unauthenticated
        if not cls._can_create(request.user, session):
            return cls._forbidden_response()
        return None

    @classmethod
    def _can_view(cls, user, session):
        game = session.game
        return (
            user.is_superuser or user.is_staff
            or game.players.filter(user=user).exists()
            or game.game_masters.filter(user=user).exists()
        )

    @classmethod
    def _can_create(cls, user, session):
        game = session.game
        return (
            game.players.filter(user=user).exists()
            or game.game_masters.filter(user=user).exists()
        )
```

### Step 5 — Serializers

Add `backend/games/serializers/games/sessions/messages/` (new subfolder, mirroring
`serializers/games/sessions/` and `serializers/games/tasks/`):

`session_message_user.py` — the reduced author view from the issue's payload:

```python
"""Reduced author view for a session message, for security (no email etc.)."""

from rest_framework import serializers

from games.gravatar import GravatarUrlBuilder
from games.models import UserProfile


class SessionMessageUserSerializer(serializers.Serializer):
    """Serializer exposing only a message author's name and avatar URL."""

    name = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()

    def get_name(self, user):
        return user.username

    def get_avatar_url(self, user):
        profile, _ = UserProfile.objects.get_or_create(user=user)
        return GravatarUrlBuilder.build(profile.email_hash)
```

`session_message_list.py`:

```python
"""Session message list/detail serializer for the games app."""

from rest_framework import serializers

from games.models import GameSessionMessage

from .session_message_user import SessionMessageUserSerializer


class SessionMessageListSerializer(serializers.ModelSerializer):
    """Serializer for session message list items, also reused for the create response."""

    user = SessionMessageUserSerializer(read_only=True)

    class Meta:
        model = GameSessionMessage
        fields = ['id', 'content', 'user', 'created_at']
```

`session_message_create.py`:

```python
"""Session message create serializer for the games app."""

from rest_framework import serializers

from games.models import GameSessionMessage


class SessionMessageCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new session message."""

    class Meta:
        model = GameSessionMessage
        fields = ['content']
        extra_kwargs = {'content': {'required': True}}
```

Register all three in `backend/games/serializers/__init__.py`, matching the existing
alphabetized import/`__all__` list style.

### Step 6 — View and URL

Add `backend/games/views/game_sessions/session_messages_list.py`:

```python
"""View for listing a session's messages or posting a new one."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ...authentication import CookieTokenAuthentication
from ...models import Game, GameSession
from ...permissions import SessionMessagePermission
from ...serializers import SessionMessageCreateSerializer, SessionMessageListSerializer
from ...session_message_paginator import SessionMessagePaginator
from ..common import validated_or_error


@api_view(['GET', 'POST'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: authorisation is enforced inline below via SessionMessagePermission, since
# both GET and POST require the requester to be a player/DM/superuser/staff (view) or a
# player/DM (create) — there is no public read path, unlike GameSession's own detail view.
@permission_classes([AllowAny])
def session_messages_list(request, game_slug, session_id):
    """Return a paginated list of a session's messages, or create a new one."""
    game = get_object_or_404(Game, game_slug=game_slug)
    session = get_object_or_404(GameSession, id=session_id, game=game)

    if request.method == 'POST':
        error_response = SessionMessagePermission.check_create(request, session)
        if error_response:
            return error_response
        return _create_message(request, session)

    error_response = SessionMessagePermission.check_view(request, session)
    if error_response:
        return error_response
    return _list_messages(request, session)


def _list_messages(request, session):
    """Paginate and serialize `session`'s messages, honoring the NEXT-ENTRY-ID cursor."""
    page, headers = SessionMessagePaginator(request, session.messages.all()).paginate()
    serializer = SessionMessageListSerializer(page, many=True)
    headers['X-Skip-Cache'] = 'true'
    return Response(serializer.data, headers=headers)


def _create_message(request, session):
    """Validate the request and create a new message for the session, returning 201 detail."""
    serializer = SessionMessageCreateSerializer(data=request.data)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    player = session.game.players.filter(user=request.user).first()
    message = serializer.save(session=session, user=request.user, player=player)
    detail = SessionMessageListSerializer(message)
    response = Response(detail.data, status=201)
    response['X-Skip-Cache'] = 'true'
    return response
```

Add to `backend/games/urls/games.py`, right after the existing
`games/<slug:game_slug>/sessions/<int:session_id>.json` entry:

```python
path(
    'games/<slug:game_slug>/sessions/<int:session_id>/messages.json',
    views.session_messages_list,
    name='session-messages-list',
),
```

Register `session_messages_list` in `backend/games/views/game_sessions/__init__.py` and the
top-level `backend/games/views/__init__.py`, matching how `game_tasks_list` is exported.

**Player note**: `session.game.players.filter(user=request.user).first()` — if a user
happens to be linked to more than one `Player` row in the same game (the model's `M2M`
allows it, though this shouldn't normally happen), `.first()` picks an arbitrary one. A DM
posting has no matching `Player` row, so `player` stays `None` for them, matching the
issue's "link to the player only when the poster is a player, not the DM."

## Files to Change

- `backend/games/gravatar.py` — new `GravatarUrlBuilder`
- `backend/games/serializers/auth/my_account_detail.py` — refactor `get_avatar_url` to use `GravatarUrlBuilder`
- `backend/games/models/game/game_session_message.py` — new model
- `backend/games/models/__init__.py` — register `GameSessionMessage`
- `backend/games/migrations/00XX_gamesessionmessage.py` — new migration
- `backend/games/session_message_paginator.py` — new cursor paginator
- `backend/games/permissions.py` — new `SessionMessagePermission`
- `backend/games/serializers/games/sessions/messages/session_message_user.py` — new
- `backend/games/serializers/games/sessions/messages/session_message_list.py` — new
- `backend/games/serializers/games/sessions/messages/session_message_create.py` — new
- `backend/games/serializers/__init__.py` — register the three new serializers
- `backend/games/views/game_sessions/session_messages_list.py` — new view
- `backend/games/views/game_sessions/__init__.py` — register the new view
- `backend/games/views/__init__.py` — register the new view
- `backend/games/urls/games.py` — new URL entry
- `backend/games/tests/models/game/game_session_message_test.py` — new model tests
- `backend/games/tests/gravatar_test.py` — new `GravatarUrlBuilder` tests
- `backend/games/tests/serializers/auth/my_account_detail_test.py` — update for the refactor (behavior unchanged, still covers null/present cases)
- `backend/games/tests/session_message_paginator_test.py` — new cursor-pagination tests (first page, cursor page, dedupe/boundary, empty NEXT-ENTRY-ID at the end)
- `backend/games/tests/permissions_test.py` — new `SessionMessagePermission` tests (view: player/dm/superuser/staff allowed, outsider denied; create: player/dm allowed, superuser/staff/outsider denied)
- `backend/games/tests/views/game_sessions/session_messages_list_test.py` — new view tests (GET pagination + headers, POST create + player linkage, permission denials, `X-Skip-Cache` header)

## CI Checks

- `backend`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_rest`)
- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_all`)

## Notes

- Use `PlayerFactory`/`GameMasterFactory`/`SuperUserFactory`/`UserFactory`
  (`backend/games/tests/factories.py`) for test fixtures; there's no `GameSessionFactory` —
  existing session tests (`backend/games/tests/models/game/game_session_test.py`) construct
  `GameSession.objects.create(...)` directly, follow that convention.
- Double-check the actual latest migration filename in `backend/games/migrations/` at
  implementation time (depends on where #528's migration landed) before setting this
  migration's `dependencies`.
