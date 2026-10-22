"""View for retrieving, or updating, a single item held by an NPC."""

from .......decorators import token_scopes
from ....._character.items._item_shared import build_item_detail_view

game_npc_item_detail = token_scopes(GET=[], PATCH=['npcs:write', 'items:read'])(
    build_item_detail_view(npc=True),
)
