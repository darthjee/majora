"""View for retrieving, or updating, a single item held by an NPC."""

from ....._character.items._item_shared import build_item_detail_view

game_npc_item_detail = build_item_detail_view(npc=True)
