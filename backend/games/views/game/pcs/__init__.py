"""Views for PC (Player Character) endpoints."""

from .detail.documents.game_pc_document_acquire import game_pc_document_acquire
from .detail.documents.game_pc_document_acquire_all import game_pc_document_acquire_all
from .detail.documents.game_pc_document_detail import game_pc_document_detail
from .detail.documents.game_pc_document_detail_full import game_pc_document_detail_full
from .detail.documents.game_pc_document_files import game_pc_document_files
from .detail.documents.game_pc_document_files_all import game_pc_document_files_all
from .detail.documents.game_pc_document_photos import game_pc_document_photos
from .detail.documents.game_pc_document_photos_all import game_pc_document_photos_all
from .detail.documents.game_pc_document_remove import game_pc_document_remove
from .detail.documents.game_pc_document_remove_all import game_pc_document_remove_all
from .detail.documents.game_pc_documents import game_pc_documents
from .detail.documents.game_pc_documents_all import game_pc_documents_all
from .detail.documents.game_pc_documents_available import game_pc_documents_available
from .detail.documents.game_pc_documents_available_all import game_pc_documents_available_all
from .detail.game_pc_access import game_pc_access
from .detail.game_pc_full import game_pc_full
from .detail.game_pc_photo_upload import game_pc_photo_upload
from .detail.items.game_pc_item_acquire import game_pc_item_acquire
from .detail.items.game_pc_item_acquire_all import game_pc_item_acquire_all
from .detail.items.game_pc_item_detail import game_pc_item_detail
from .detail.items.game_pc_item_detail_full import game_pc_item_detail_full
from .detail.items.game_pc_item_photo_upload import game_pc_item_photo_upload
from .detail.items.game_pc_item_remove import game_pc_item_remove
from .detail.items.game_pc_item_remove_all import game_pc_item_remove_all
from .detail.items.game_pc_item_summary import game_pc_item_summary
from .detail.items.game_pc_item_summary_all import game_pc_item_summary_all
from .detail.items.game_pc_items import game_pc_items
from .detail.items.game_pc_items_all import game_pc_items_all
from .detail.items.game_pc_items_available import game_pc_items_available
from .detail.items.game_pc_items_available_all import game_pc_items_available_all
from .detail.photos.game_pc_photo_deletable import game_pc_photo_deletable
from .detail.photos.game_pc_photo_detail import game_pc_photo_detail
from .detail.photos.game_pc_photo_set import game_pc_photo_set
from .detail.photos.game_pc_photos import game_pc_photos
from .detail.treasures.game_pc_treasure_acquire import game_pc_treasure_acquire
from .detail.treasures.game_pc_treasure_acquire_all import game_pc_treasure_acquire_all
from .detail.treasures.game_pc_treasure_buy import game_pc_treasure_buy
from .detail.treasures.game_pc_treasure_buy_all import game_pc_treasure_buy_all
from .detail.treasures.game_pc_treasure_remove import game_pc_treasure_remove
from .detail.treasures.game_pc_treasure_sell import game_pc_treasure_sell
from .detail.treasures.game_pc_treasure_summary import game_pc_treasure_summary
from .detail.treasures.game_pc_treasure_summary_all import game_pc_treasure_summary_all
from .detail.treasures.game_pc_treasures import game_pc_treasures
from .game_pc_detail import game_pc_detail
from .game_pcs import game_pcs

__all__ = [
    'game_pcs',
    'game_pc_detail',
    'game_pc_full',
    'game_pc_access',
    'game_pc_photo_upload',
    'game_pc_photo_set',
    'game_pc_photo_detail',
    'game_pc_photo_deletable',
    'game_pc_photos',
    'game_pc_documents',
    'game_pc_documents_all',
    'game_pc_document_detail',
    'game_pc_document_detail_full',
    'game_pc_document_files',
    'game_pc_document_files_all',
    'game_pc_document_photos',
    'game_pc_document_photos_all',
    'game_pc_documents_available',
    'game_pc_documents_available_all',
    'game_pc_document_acquire',
    'game_pc_document_acquire_all',
    'game_pc_document_remove',
    'game_pc_document_remove_all',
    'game_pc_items',
    'game_pc_items_all',
    'game_pc_item_detail',
    'game_pc_item_detail_full',
    'game_pc_item_photo_upload',
    'game_pc_items_available',
    'game_pc_items_available_all',
    'game_pc_item_acquire',
    'game_pc_item_acquire_all',
    'game_pc_item_remove',
    'game_pc_item_remove_all',
    'game_pc_item_summary',
    'game_pc_item_summary_all',
    'game_pc_treasures',
    'game_pc_treasure_buy',
    'game_pc_treasure_buy_all',
    'game_pc_treasure_sell',
    'game_pc_treasure_acquire',
    'game_pc_treasure_acquire_all',
    'game_pc_treasure_remove',
    'game_pc_treasure_summary',
    'game_pc_treasure_summary_all',
]
