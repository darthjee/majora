"""Views for NPC (Non-Player Character) endpoints."""

from .detail.documents.game_npc_document_acquire import game_npc_document_acquire
from .detail.documents.game_npc_document_acquire_all import game_npc_document_acquire_all
from .detail.documents.game_npc_document_detail import game_npc_document_detail
from .detail.documents.game_npc_document_detail_full import game_npc_document_detail_full
from .detail.documents.game_npc_document_files import game_npc_document_files
from .detail.documents.game_npc_document_files_all import game_npc_document_files_all
from .detail.documents.game_npc_document_photos import game_npc_document_photos
from .detail.documents.game_npc_document_photos_all import game_npc_document_photos_all
from .detail.documents.game_npc_document_remove import game_npc_document_remove
from .detail.documents.game_npc_document_remove_all import game_npc_document_remove_all
from .detail.documents.game_npc_document_summary import game_npc_document_summary
from .detail.documents.game_npc_document_summary_all import game_npc_document_summary_all
from .detail.documents.game_npc_documents import game_npc_documents
from .detail.documents.game_npc_documents_all import game_npc_documents_all
from .detail.documents.game_npc_documents_available import game_npc_documents_available
from .detail.documents.game_npc_documents_available_all import game_npc_documents_available_all
from .detail.factions.game_npc_faction_acquire import game_npc_faction_acquire
from .detail.factions.game_npc_faction_acquire_all import game_npc_faction_acquire_all
from .detail.factions.game_npc_faction_detail import game_npc_faction_detail
from .detail.factions.game_npc_faction_detail_full import game_npc_faction_detail_full
from .detail.factions.game_npc_faction_remove import game_npc_faction_remove
from .detail.factions.game_npc_faction_remove_all import game_npc_faction_remove_all
from .detail.factions.game_npc_faction_summary import game_npc_faction_summary
from .detail.factions.game_npc_faction_summary_all import game_npc_faction_summary_all
from .detail.factions.game_npc_factions import game_npc_factions
from .detail.factions.game_npc_factions_all import game_npc_factions_all
from .detail.factions.game_npc_factions_available import game_npc_factions_available
from .detail.factions.game_npc_factions_available_all import game_npc_factions_available_all
from .detail.game_npc_access import game_npc_access
from .detail.game_npc_full import game_npc_full
from .detail.game_npc_photo_upload import game_npc_photo_upload
from .detail.items.game_npc_item_acquire import game_npc_item_acquire
from .detail.items.game_npc_item_acquire_all import game_npc_item_acquire_all
from .detail.items.game_npc_item_detail import game_npc_item_detail
from .detail.items.game_npc_item_detail_full import game_npc_item_detail_full
from .detail.items.game_npc_item_photo_upload import game_npc_item_photo_upload
from .detail.items.game_npc_item_remove import game_npc_item_remove
from .detail.items.game_npc_item_remove_all import game_npc_item_remove_all
from .detail.items.game_npc_item_summary import game_npc_item_summary
from .detail.items.game_npc_item_summary_all import game_npc_item_summary_all
from .detail.items.game_npc_items import game_npc_items
from .detail.items.game_npc_items_all import game_npc_items_all
from .detail.items.game_npc_items_available import game_npc_items_available
from .detail.items.game_npc_items_available_all import game_npc_items_available_all
from .detail.photos.game_npc_photo_deletable import game_npc_photo_deletable
from .detail.photos.game_npc_photo_detail import game_npc_photo_detail
from .detail.photos.game_npc_photo_set import game_npc_photo_set
from .detail.photos.game_npc_photos import game_npc_photos
from .detail.possessions.game_npc_possession_acquire import game_npc_possession_acquire
from .detail.possessions.game_npc_possession_acquire_all import game_npc_possession_acquire_all
from .detail.possessions.game_npc_possession_detail import game_npc_possession_detail
from .detail.possessions.game_npc_possession_detail_full import game_npc_possession_detail_full
from .detail.possessions.game_npc_possession_remove import game_npc_possession_remove
from .detail.possessions.game_npc_possession_remove_all import game_npc_possession_remove_all
from .detail.possessions.game_npc_possessions import game_npc_possessions
from .detail.possessions.game_npc_possessions_all import game_npc_possessions_all
from .detail.possessions.game_npc_possessions_available import game_npc_possessions_available
from .detail.possessions.game_npc_possessions_available_all import (
    game_npc_possessions_available_all,
)
from .detail.treasures.game_npc_treasure_acquire import game_npc_treasure_acquire
from .detail.treasures.game_npc_treasure_acquire_all import game_npc_treasure_acquire_all
from .detail.treasures.game_npc_treasure_buy import game_npc_treasure_buy
from .detail.treasures.game_npc_treasure_buy_all import game_npc_treasure_buy_all
from .detail.treasures.game_npc_treasure_remove import game_npc_treasure_remove
from .detail.treasures.game_npc_treasure_sell import game_npc_treasure_sell
from .detail.treasures.game_npc_treasure_summary import game_npc_treasure_summary
from .detail.treasures.game_npc_treasure_summary_all import game_npc_treasure_summary_all
from .detail.treasures.game_npc_treasures import game_npc_treasures
from .detail.treasures.game_npc_treasures_all import game_npc_treasures_all
from .game_npc_detail import game_npc_detail
from .game_npcs import game_npcs
from .game_npcs_all import game_npcs_all
from .game_npcs_full import game_npcs_full

__all__ = [
    'game_npcs',
    'game_npc_detail',
    'game_npcs_all',
    'game_npcs_full',
    'game_npc_full',
    'game_npc_access',
    'game_npc_photo_upload',
    'game_npc_photo_set',
    'game_npc_photo_detail',
    'game_npc_photo_deletable',
    'game_npc_photos',
    'game_npc_documents',
    'game_npc_documents_all',
    'game_npc_document_detail',
    'game_npc_document_detail_full',
    'game_npc_document_files',
    'game_npc_document_files_all',
    'game_npc_document_photos',
    'game_npc_document_photos_all',
    'game_npc_documents_available',
    'game_npc_documents_available_all',
    'game_npc_document_acquire',
    'game_npc_document_acquire_all',
    'game_npc_document_remove',
    'game_npc_document_remove_all',
    'game_npc_document_summary',
    'game_npc_document_summary_all',
    'game_npc_factions',
    'game_npc_factions_all',
    'game_npc_faction_detail',
    'game_npc_faction_detail_full',
    'game_npc_factions_available',
    'game_npc_factions_available_all',
    'game_npc_faction_acquire',
    'game_npc_faction_acquire_all',
    'game_npc_faction_remove',
    'game_npc_faction_remove_all',
    'game_npc_faction_summary',
    'game_npc_faction_summary_all',
    'game_npc_items',
    'game_npc_items_all',
    'game_npc_item_detail',
    'game_npc_item_detail_full',
    'game_npc_item_photo_upload',
    'game_npc_items_available',
    'game_npc_items_available_all',
    'game_npc_item_acquire',
    'game_npc_item_acquire_all',
    'game_npc_item_remove',
    'game_npc_item_remove_all',
    'game_npc_item_summary',
    'game_npc_item_summary_all',
    'game_npc_possessions',
    'game_npc_possessions_all',
    'game_npc_possession_detail',
    'game_npc_possession_detail_full',
    'game_npc_possessions_available',
    'game_npc_possessions_available_all',
    'game_npc_possession_acquire',
    'game_npc_possession_acquire_all',
    'game_npc_possession_remove',
    'game_npc_possession_remove_all',
    'game_npc_treasures',
    'game_npc_treasures_all',
    'game_npc_treasure_buy',
    'game_npc_treasure_buy_all',
    'game_npc_treasure_sell',
    'game_npc_treasure_acquire',
    'game_npc_treasure_acquire_all',
    'game_npc_treasure_remove',
    'game_npc_treasure_summary',
    'game_npc_treasure_summary_all',
]
