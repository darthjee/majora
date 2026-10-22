"""View for the full (private-description-included) NPC detail endpoint."""

from .....decorators import token_scopes
from ..._character import build_full_view

game_npc_full = token_scopes(GET=['npcs:read'], PATCH=['npcs:write'])(build_full_view(npc=True))
