"""Views for game-level endpoints."""

from .game_access import game_access
from .game_detail import game_detail
from .game_document_detail import game_document_detail
from .game_document_detail_full import game_document_detail_full
from .game_documents import game_documents
from .game_documents_all import game_documents_all
from .game_item_detail import game_item_detail
from .game_item_detail_full import game_item_detail_full
from .game_item_photo_upload import game_item_photo_upload
from .game_items import game_items
from .game_items_all import game_items_all
from .game_permissions import game_permissions
from .game_photos import game_photos
from .game_treasure_detail import game_treasure_detail
from .game_treasure_link import game_treasure_link
from .game_treasures import game_treasures
from .game_treasures_all import game_treasures_all
from .game_treasures_missing import game_treasures_missing
from .games_list import games_list
from .my_games_list import my_games_list

__all__ = [
    'games_list',
    'game_detail',
    'game_access',
    'game_permissions',
    'game_treasures',
    'game_treasures_all',
    'game_treasures_missing',
    'game_treasure_link',
    'game_treasure_detail',
    'game_documents',
    'game_documents_all',
    'game_document_detail',
    'game_document_detail_full',
    'game_items',
    'game_items_all',
    'game_item_detail',
    'game_item_detail_full',
    'game_item_photo_upload',
    'game_photos',
    'my_games_list',
]
