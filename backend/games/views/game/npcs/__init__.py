"""Views for NPC (Non-Player Character) endpoints."""

from .detail.documents.game_npc_documents import game_npc_documents
from .detail.documents.game_npc_documents_all import game_npc_documents_all
from .detail.game_npc_access import game_npc_access
from .detail.game_npc_full import game_npc_full
from .detail.game_npc_money import game_npc_money
from .detail.game_npc_permissions import game_npc_permissions
from .detail.game_npc_photo_upload import game_npc_photo_upload
from .detail.items.game_npc_item_detail import game_npc_item_detail
from .detail.items.game_npc_item_detail_full import game_npc_item_detail_full
from .detail.items.game_npc_item_photo_upload import game_npc_item_photo_upload
from .detail.items.game_npc_items import game_npc_items
from .detail.items.game_npc_items_all import game_npc_items_all
from .detail.photos.game_npc_photo_set import game_npc_photo_set
from .detail.photos.game_npc_photos import game_npc_photos
from .detail.treasures.game_npc_treasure_buy import game_npc_treasure_buy
from .detail.treasures.game_npc_treasure_buy_all import game_npc_treasure_buy_all
from .detail.treasures.game_npc_treasure_sell import game_npc_treasure_sell
from .detail.treasures.game_npc_treasures import game_npc_treasures
from .detail.treasures.game_npc_treasures_all import game_npc_treasures_all
from .game_npc_detail import game_npc_detail
from .game_npcs import game_npcs
from .game_npcs_all import game_npcs_all

__all__ = [
    'game_npcs',
    'game_npc_detail',
    'game_npcs_all',
    'game_npc_full',
    'game_npc_money',
    'game_npc_access',
    'game_npc_permissions',
    'game_npc_photo_upload',
    'game_npc_photo_set',
    'game_npc_photos',
    'game_npc_documents',
    'game_npc_documents_all',
    'game_npc_items',
    'game_npc_items_all',
    'game_npc_item_detail',
    'game_npc_item_detail_full',
    'game_npc_item_photo_upload',
    'game_npc_treasures',
    'game_npc_treasures_all',
    'game_npc_treasure_buy',
    'game_npc_treasure_buy_all',
    'game_npc_treasure_sell',
]
