"""View for the PC money-only update endpoint."""

from ..._character_shared import build_money_view

game_pc_money = build_money_view(npc=False)
