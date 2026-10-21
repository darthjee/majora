"""View for the PC items/all.json endpoint — dm, owner, or admin only (includes hidden)."""

from ......decorators import token_scopes
from ......serializers import CharacterItemAllSerializer
from ...._character.items._item_shared import build_items_all_view

game_pc_items_all = token_scopes(GET=['pcs:read', 'items:read'])(
    build_items_all_view(npc=False, serializer_class=CharacterItemAllSerializer),
)
