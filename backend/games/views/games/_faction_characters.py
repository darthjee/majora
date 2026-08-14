"""Shared implementation for the game-scoped faction character-list endpoints."""

from ...models import Character
from ...serializers import GameFactionCharacterSerializer
from ..common import paginated_list_response


def faction_characters(request, game, faction, allow_hidden):
    """Return a paginated list of characters belonging to `faction`.

    Excludes hidden characters unless `allow_hidden` (the DM/admin-only `/characters/all.json`
    variant). Slain characters are included by default, matching the main PC/NPC list
    endpoints' convention. Queries `Character` directly (not `CharacterFaction`) since
    `GameFactionCharacterSerializer` serializes the character itself.
    """
    characters = Character.objects.filter(game=game, character_factions__game_faction=faction)
    if not allow_hidden:
        characters = characters.exclude(hidden=True)
    return paginated_list_response(request, characters, GameFactionCharacterSerializer)
