"""Serializers package for the games app."""

from games.serializers.character_access import CharacterAccessSerializer
from games.serializers.character_detail import CharacterDetailSerializer
from games.serializers.character_full import CharacterFullSerializer
from games.serializers.character_link import CharacterLinkSerializer
from games.serializers.character_list import CharacterListSerializer
from games.serializers.character_update import CharacterUpdateSerializer
from games.serializers.game_access import GameAccessSerializer
from games.serializers.game_create import GameCreateSerializer
from games.serializers.game_detail import GameDetailSerializer
from games.serializers.game_list import GameListSerializer
from games.serializers.game_master import GameMasterSerializer
from games.serializers.game_photo import GamePhotoSerializer
from games.serializers.game_update import GameUpdateSerializer
from games.serializers.link import LinkSerializer
from games.serializers.pc_access import PcAccessSerializer
from games.serializers.photo import PhotoSerializer
from games.serializers.photo_upload import PhotoUploadSerializer
from games.serializers.treasure_access import TreasureAccessSerializer
from games.serializers.treasure_create import TreasureCreateSerializer
from games.serializers.treasure_detail import TreasureDetailSerializer
from games.serializers.treasure_list import TreasureListSerializer
from games.serializers.treasure_update import TreasureUpdateSerializer

__all__ = [
    'CharacterAccessSerializer',
    'CharacterDetailSerializer',
    'CharacterFullSerializer',
    'CharacterLinkSerializer',
    'CharacterListSerializer',
    'CharacterUpdateSerializer',
    'GameAccessSerializer',
    'GameCreateSerializer',
    'GameDetailSerializer',
    'GameListSerializer',
    'GameMasterSerializer',
    'GamePhotoSerializer',
    'GameUpdateSerializer',
    'LinkSerializer',
    'PcAccessSerializer',
    'PhotoSerializer',
    'PhotoUploadSerializer',
    'TreasureAccessSerializer',
    'TreasureCreateSerializer',
    'TreasureDetailSerializer',
    'TreasureListSerializer',
    'TreasureUpdateSerializer',
]
