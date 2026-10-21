"""View for the full (private-description-included) PC detail endpoint."""

from .....decorators import token_scopes
from ..._character import build_full_view

game_pc_full = token_scopes(GET=['pcs:read'], PATCH=['pcs:write'])(build_full_view(npc=False))
