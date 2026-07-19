"""View for the NPC money-only update endpoint."""

from ..._character_shared import build_money_view

game_npc_money = build_money_view(npc=True)
