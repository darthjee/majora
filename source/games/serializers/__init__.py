"""Serializers package for the games app."""

from games.serializers.character_access import CharacterAccessSerializer
from games.serializers.character_create import CharacterCreateSerializer
from games.serializers.character_detail import CharacterDetailSerializer
from games.serializers.character_full import CharacterFullSerializer
from games.serializers.character_full_list import CharacterFullListSerializer
from games.serializers.character_link import CharacterLinkSerializer
from games.serializers.character_list import CharacterListSerializer
from games.serializers.character_photo import CharacterPhotoSerializer
from games.serializers.character_slain_update import CharacterSlainUpdateSerializer
from games.serializers.character_treasure import CharacterTreasureSerializer
from games.serializers.character_update import CharacterUpdateSerializer
from games.serializers.game_access import GameAccessSerializer
from games.serializers.game_create import GameCreateSerializer
from games.serializers.game_detail import GameDetailSerializer
from games.serializers.game_list import GameListSerializer
from games.serializers.game_master import GameMasterSerializer
from games.serializers.game_photo import GamePhotoSerializer
from games.serializers.game_session_create import GameSessionCreateSerializer
from games.serializers.game_session_detail import GameSessionDetailSerializer
from games.serializers.game_session_list import GameSessionListSerializer
from games.serializers.game_session_update import GameSessionUpdateSerializer
from games.serializers.game_task_create import GameTaskCreateSerializer
from games.serializers.game_task_list import GameTaskListSerializer
from games.serializers.game_task_update import GameTaskUpdateSerializer
from games.serializers.game_treasure_update import GameTreasureUpdateSerializer
from games.serializers.game_update import GameUpdateSerializer
from games.serializers.link import LinkSerializer
from games.serializers.my_account_detail import MyAccountDetailSerializer
from games.serializers.my_account_update import MyAccountUpdateSerializer
from games.serializers.pc_access import PcAccessSerializer
from games.serializers.photo_upload import PhotoUploadSerializer
from games.serializers.staff_user_detail import StaffUserDetailSerializer
from games.serializers.staff_user_list import StaffUserListSerializer
from games.serializers.staff_user_update import StaffUserUpdateSerializer
from games.serializers.treasure_access import TreasureAccessSerializer
from games.serializers.treasure_create import TreasureCreateSerializer
from games.serializers.treasure_detail import TreasureDetailSerializer
from games.serializers.treasure_list import TreasureListSerializer
from games.serializers.treasure_update import TreasureUpdateSerializer

__all__ = [
    'CharacterAccessSerializer',
    'CharacterCreateSerializer',
    'CharacterDetailSerializer',
    'CharacterFullListSerializer',
    'CharacterFullSerializer',
    'CharacterLinkSerializer',
    'CharacterListSerializer',
    'CharacterPhotoSerializer',
    'CharacterSlainUpdateSerializer',
    'CharacterTreasureSerializer',
    'CharacterUpdateSerializer',
    'GameAccessSerializer',
    'GameCreateSerializer',
    'GameDetailSerializer',
    'GameListSerializer',
    'GameMasterSerializer',
    'GamePhotoSerializer',
    'GameSessionCreateSerializer',
    'GameSessionDetailSerializer',
    'GameSessionListSerializer',
    'GameSessionUpdateSerializer',
    'GameTaskCreateSerializer',
    'GameTaskListSerializer',
    'GameTaskUpdateSerializer',
    'GameTreasureUpdateSerializer',
    'GameUpdateSerializer',
    'LinkSerializer',
    'MyAccountDetailSerializer',
    'MyAccountUpdateSerializer',
    'PcAccessSerializer',
    'PhotoUploadSerializer',
    'StaffUserDetailSerializer',
    'StaffUserListSerializer',
    'StaffUserUpdateSerializer',
    'TreasureAccessSerializer',
    'TreasureCreateSerializer',
    'TreasureDetailSerializer',
    'TreasureListSerializer',
    'TreasureUpdateSerializer',
]
