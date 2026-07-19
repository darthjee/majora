"""View for the PC permissions-check endpoint."""

from ..._character_shared import build_permissions_view

game_pc_permissions = build_permissions_view(npc=False)
