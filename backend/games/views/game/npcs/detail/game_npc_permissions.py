"""View for the NPC permissions-check endpoint."""

from ..._character_shared import build_permissions_view

game_npc_permissions = build_permissions_view(npc=True)
