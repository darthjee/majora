"""Views for game-level endpoints."""

from .game_access import game_access
from .game_detail import game_detail
from .game_document_detail import game_document_detail
from .game_document_detail_full import game_document_detail_full
from .game_document_file_photo_upload import game_document_file_photo_upload
from .game_document_file_upload import game_document_file_upload
from .game_document_files import game_document_files
from .game_document_files_all import game_document_files_all
from .game_document_photo_set import game_document_photo_set
from .game_document_photo_upload import game_document_photo_upload
from .game_document_photos import game_document_photos
from .game_document_photos_all import game_document_photos_all
from .game_documents import game_documents
from .game_documents_all import game_documents_all
from .game_item_detail import game_item_detail
from .game_item_detail_full import game_item_detail_full
from .game_item_photo_upload import game_item_photo_upload
from .game_items import game_items
from .game_items_all import game_items_all
from .game_photos import game_photos
from .game_possession_detail import game_possession_detail
from .game_possession_detail_full import game_possession_detail_full
from .game_possession_photo_upload import game_possession_photo_upload
from .game_possessions import game_possessions
from .game_possessions_all import game_possessions_all
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
    'game_treasures',
    'game_treasures_all',
    'game_treasures_missing',
    'game_treasure_link',
    'game_treasure_detail',
    'game_documents',
    'game_documents_all',
    'game_document_detail',
    'game_document_detail_full',
    'game_document_photos',
    'game_document_photos_all',
    'game_document_photo_upload',
    'game_document_photo_set',
    'game_document_file_upload',
    'game_document_file_photo_upload',
    'game_document_files',
    'game_document_files_all',
    'game_items',
    'game_items_all',
    'game_item_detail',
    'game_item_detail_full',
    'game_item_photo_upload',
    'game_photos',
    'game_possessions',
    'game_possessions_all',
    'game_possession_detail',
    'game_possession_detail_full',
    'game_possession_photo_upload',
    'my_games_list',
]
