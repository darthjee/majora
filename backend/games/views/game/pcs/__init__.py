"""Views for PC (Player Character) endpoints."""

from .detail.documents.game_pc_documents import game_pc_documents
from .detail.documents.game_pc_documents_all import game_pc_documents_all
from .detail.game_pc_access import game_pc_access
from .detail.game_pc_full import game_pc_full
from .detail.game_pc_money import game_pc_money
from .detail.game_pc_permissions import game_pc_permissions
from .detail.game_pc_photo_upload import game_pc_photo_upload
from .detail.items.game_pc_item_detail import game_pc_item_detail
from .detail.items.game_pc_item_detail_full import game_pc_item_detail_full
from .detail.items.game_pc_item_photo_upload import game_pc_item_photo_upload
from .detail.items.game_pc_items import game_pc_items
from .detail.items.game_pc_items_all import game_pc_items_all
from .detail.photos.game_pc_photo_set import game_pc_photo_set
from .detail.photos.game_pc_photos import game_pc_photos
from .detail.treasures.game_pc_treasure_acquire import game_pc_treasure_acquire
from .detail.treasures.game_pc_treasure_acquire_all import game_pc_treasure_acquire_all
from .detail.treasures.game_pc_treasure_sell import game_pc_treasure_sell
from .detail.treasures.game_pc_treasures import game_pc_treasures
from .game_pc_detail import game_pc_detail
from .game_pcs import game_pcs

__all__ = [
    'game_pcs',
    'game_pc_detail',
    'game_pc_full',
    'game_pc_money',
    'game_pc_access',
    'game_pc_permissions',
    'game_pc_photo_upload',
    'game_pc_photo_set',
    'game_pc_photos',
    'game_pc_documents',
    'game_pc_documents_all',
    'game_pc_items',
    'game_pc_items_all',
    'game_pc_item_detail',
    'game_pc_item_detail_full',
    'game_pc_item_photo_upload',
    'game_pc_treasures',
    'game_pc_treasure_acquire',
    'game_pc_treasure_acquire_all',
    'game_pc_treasure_sell',
]
