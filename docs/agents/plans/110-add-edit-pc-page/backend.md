# Backend plan — issue #110 (add edit PC page)

See [plan.md](plan.md) for the full shared contract (request/response shapes) this file
implements.

## 1. Link `Player` to `User`

`source/games/models.py:35` — add a nullable FK so a `Player` can be tied to the account that
controls it:

```python
class Player(models.Model):
    name = models.CharField(max_length=200)
    games = models.ManyToManyField(Game, blank=True, related_name='players')
    user = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='players_accounts',
    )
```

(`User` is already imported at `source/games/models.py:5`.) Generate the migration:

```bash
docker-compose run --rm majora_be python manage.py makemigrations games
```

No admin changes needed — `source/games/admin.py` registers `Player` as a plain
`ModelAdmin`, which already exposes all fields including the new one.

## 2. Permission helper

Add a small helper next to `Character` in `source/games/models.py` (or as a free function in
`source/games/views/characters.py` if it's only ever used there — prefer the model if it reads
naturally as a method):

```python
def can_be_edited_by(self, user):
    """Return True if `user` may edit this character (its player or a superuser)."""
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    return self.player_id is not None and self.player.user_id == user.id
```

## 3. `can_edit` on the detail serializer

`source/games/serializers.py:52` — `CharacterDetailSerializer` needs the requesting user,
which DRF passes through serializer context when the view sets it:

```python
class CharacterDetailSerializer(serializers.ModelSerializer):
    photos = PhotoSerializer(many=True, read_only=True)
    is_pc = serializers.ReadOnlyField()
    game_slug = serializers.ReadOnlyField(source='game.game_slug')
    can_edit = serializers.SerializerMethodField()

    class Meta:
        model = Character
        fields = [
            'id', 'name', 'avatar_url', 'character_class', 'level',
            'description', 'is_pc', 'photos', 'game_slug', 'can_edit',
        ]

    def get_can_edit(self, obj):
        return obj.can_be_edited_by(self.context.get('request').user)
```

This also changes `game_npc_detail` (`source/games/views/characters.py:32`), which reuses
`CharacterDetailSerializer` — pass `context={'request': request}` there too so it doesn't break
(NPCs simply won't be editable by anyone via this issue's permission rule, but the field must
still serialize without crashing on a missing context).

## 4. Writable serializer for PATCH

Add to `source/games/serializers.py`:

```python
class CharacterUpdateSerializer(serializers.ModelSerializer):
    """Serializer for the limited set of fields a player may edit on their PC."""

    class Meta:
        model = Character
        fields = ['name', 'avatar_url', 'character_class', 'level', 'description']
        extra_kwargs = {field: {'required': False} for field in fields}
```

Listing only these fields in `Meta.fields` is what keeps any other key in the request body
from ever being written, regardless of what the client sends — DRF's `ModelSerializer` only
reads keys it declares.

## 5. Extend the `game_pc_detail` view to support `PATCH`

`source/games/views/characters.py:41-47` — replace with:

```python
from rest_framework.authentication import TokenAuthentication
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from ..serializers import CharacterDetailSerializer, CharacterListSerializer, CharacterUpdateSerializer


@api_view(['GET', 'PATCH'])
@authentication_classes([TokenAuthentication])
@permission_classes([AllowAny])
def game_pc_detail(request, game_slug, character_id):
    """Return or update detail for a specific PC in a game."""
    game = get_object_or_404(Game, game_slug=game_slug)
    character = get_object_or_404(Character, id=character_id, game=game, npc=False)

    if request.method == 'PATCH':
        return _update_pc(request, character)

    serializer = CharacterDetailSerializer(character, context={'request': request})
    return Response(serializer.data)


def _update_pc(request, character):
    if not request.user or not request.user.is_authenticated:
        return Response({'errors': {'detail': ['authentication required']}}, status=401)
    if not character.can_be_edited_by(request.user):
        return Response({'errors': {'detail': ['not allowed to edit this character']}}, status=403)

    serializer = CharacterUpdateSerializer(character, data=request.data, partial=True)
    if not serializer.is_valid():
        return Response({'errors': serializer.errors}, status=400)

    serializer.save()
    detail = CharacterDetailSerializer(character, context={'request': request})
    return Response(detail.data)
```

`AllowAny` is kept at the decorator level (the `GET` branch must stay publicly readable per
the existing behavior); the `401`/`403` checks inside `_update_pc` implement the actual
restriction for `PATCH`. `TokenAuthentication` is added so `request.user` is populated when a
valid token is sent, without forcing authentication on `GET`.

## 6. `user_id` on the status endpoint

`source/games/views/auth.py:139-143` — add the field:

```python
return Response({
    'logged_in': True,
    'username': user.username,
    'user_id': user.id,
    'settings': {'favorite_language': profile.favorite_language},
})
```

(And the `logged_in: False` branch at line 135 implicitly has no `user_id`; leave it as-is —
frontend treats it as `null`/absent.)

## 7. Tests (`source/games/tests/`)

Follow the existing convention (pytest, `@pytest.mark.django_db`, class-based, `setup_method`,
plain Django test `client` fixture — see `views_test.py`'s `TestGamePcDetailView` for the
existing GET tests to extend).

Add to `TestGamePcDetailView` (or a new `TestGamePcUpdateView` class in the same file):

- `GET` includes `can_edit: false` for an anonymous request.
- `GET` includes `can_edit: true` when the request's token belongs to the character's
  player's user, and when it belongs to a superuser.
- `PATCH` with no token → `401`.
- `PATCH` with a token belonging to an unrelated user → `403`, character unchanged in DB.
- `PATCH` with the connected player's user's token → `200`, fields updated, response includes
  updated values.
- `PATCH` with a superuser's token → `200`.
- `PATCH` attempting to set a non-editable field (e.g. `npc`, `game`) → field silently ignored,
  not persisted, other valid fields in the same request still saved.
- `PATCH` with an invalid value (e.g. `level: "not-a-number"`) → `400`,
  `{"errors": {"level": [...]}}`, character unchanged in DB.
- `PATCH` partial body (only `name`) → only `name` changes, other fields untouched.

Also add a focused test for `Character.can_be_edited_by` in `source/games/tests/models_test.py`
covering: no user/anonymous → `False`; superuser → `True`; matching player's user → `True`;
unrelated user → `False`; character with no `player` → `False` for a non-superuser.

Run locally: `docker-compose run --rm majora_tests pytest source/games` and
`docker-compose run --rm majora_be ruff check source/`.
