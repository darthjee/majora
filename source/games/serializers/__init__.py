"""Serializers package for the games app."""

from games.serializers.character_detail import CharacterDetailSerializer
from games.serializers.character_full import CharacterFullSerializer
from games.serializers.character_list import CharacterListSerializer
from games.serializers.character_update import CharacterUpdateSerializer
from games.serializers.game_create import GameCreateSerializer
from games.serializers.game_detail import GameDetailSerializer
from games.serializers.game_list import GameListSerializer
from games.serializers.game_master import GameMasterSerializer
from games.serializers.game_photo import GamePhotoSerializer
from games.serializers.game_update import GameUpdateSerializer
from games.serializers.link import LinkSerializer
from games.serializers.photo import PhotoSerializer
from games.serializers.photo_upload import PhotoUploadSerializer

__all__ = [
    'CharacterDetailSerializer',
    'CharacterFullSerializer',
    'CharacterListSerializer',
    'CharacterUpdateSerializer',
    'GameCreateSerializer',
    'GameDetailSerializer',
    'GameListSerializer',
    'GameMasterSerializer',
    'GamePhotoSerializer',
    'GameUpdateSerializer',
    'LinkSerializer',
    'PhotoSerializer',
    'PhotoUploadSerializer',
]
