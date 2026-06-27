"""Serializers package for the games app."""

from games.serializers.character_detail import CharacterDetailSerializer
from games.serializers.character_full import CharacterFullSerializer
from games.serializers.character_list import CharacterListSerializer
from games.serializers.character_update import CharacterUpdateSerializer
from games.serializers.game_detail import GameDetailSerializer
from games.serializers.game_list import GameListSerializer
from games.serializers.game_master import GameMasterSerializer
from games.serializers.game_photo import GamePhotoSerializer
from games.serializers.link import LinkSerializer
from games.serializers.photo import PhotoSerializer

__all__ = [
    'CharacterDetailSerializer',
    'CharacterFullSerializer',
    'CharacterListSerializer',
    'CharacterUpdateSerializer',
    'GameDetailSerializer',
    'GameListSerializer',
    'GameMasterSerializer',
    'GamePhotoSerializer',
    'LinkSerializer',
    'PhotoSerializer',
]
