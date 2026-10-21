"""View for retrieving, or updating, a single item held by a PC."""

from .......decorators import token_scopes
from ....._character.items._item_shared import build_item_detail_view

game_pc_item_detail = token_scopes(GET=[], PATCH=['pcs:write'])(build_item_detail_view(npc=False))
