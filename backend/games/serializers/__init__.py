"""Serializers package for the games app."""

from games.serializers.auth.my_account_detail import MyAccountDetailSerializer
from games.serializers.auth.my_account_update import MyAccountUpdateSerializer
from games.serializers.base_access import BaseAccessSerializer
from games.serializers.base_permissions import BasePermissionsSerializer
from games.serializers.characters.character_access import CharacterAccessSerializer
from games.serializers.characters.character_create import CharacterCreateSerializer
from games.serializers.characters.character_detail import CharacterDetailSerializer
from games.serializers.characters.character_full import CharacterFullSerializer
from games.serializers.characters.character_full_list import CharacterFullListSerializer
from games.serializers.characters.character_link import CharacterLinkSerializer
from games.serializers.characters.character_link_write import CharacterLinkWriteSerializer
from games.serializers.characters.character_list import CharacterListSerializer
from games.serializers.characters.character_money_update import CharacterMoneyUpdateSerializer
from games.serializers.characters.character_permissions import CharacterPermissionsSerializer
from games.serializers.characters.character_photo import CharacterPhotoSerializer
from games.serializers.characters.character_treasure import (
    CharacterTreasureAllSerializer,
    CharacterTreasureSerializer,
)
from games.serializers.characters.character_update import CharacterUpdateSerializer
from games.serializers.characters.npcs.npc_player_update import NpcPlayerUpdateSerializer
from games.serializers.characters.pcs.pc_access import PcAccessSerializer
from games.serializers.games.game_access import GameAccessSerializer
from games.serializers.games.game_create import GameCreateSerializer
from games.serializers.games.game_detail import GameDetailSerializer
from games.serializers.games.game_list import GameListSerializer
from games.serializers.games.game_master import GameMasterSerializer
from games.serializers.games.game_permissions import GamePermissionsSerializer
from games.serializers.games.game_photo import GamePhotoSerializer
from games.serializers.games.game_update import GameUpdateSerializer
from games.serializers.games.polls.poll_create import PollCreateSerializer
from games.serializers.games.polls.poll_detail import PollDetailSerializer
from games.serializers.games.polls.poll_list import PollListSerializer
from games.serializers.games.polls.poll_option import PollOptionSerializer
from games.serializers.games.polls.poll_option_vote_count import PollOptionVoteCountSerializer
from games.serializers.games.polls.poll_option_write import PollOptionWriteSerializer
from games.serializers.games.polls.poll_vote import PollVoteSerializer
from games.serializers.games.polls.poll_vote_user import PollVoteUserSerializer
from games.serializers.games.polls.poll_vote_write import PollVoteWriteSerializer
from games.serializers.games.polls.session_poll_create import SessionPollCreateSerializer
from games.serializers.games.sessions.game_session_create import GameSessionCreateSerializer
from games.serializers.games.sessions.game_session_detail import GameSessionDetailSerializer
from games.serializers.games.sessions.game_session_list import GameSessionListSerializer
from games.serializers.games.sessions.game_session_update import GameSessionUpdateSerializer
from games.serializers.games.sessions.messages.session_message_create import (
    SessionMessageCreateSerializer,
)
from games.serializers.games.sessions.messages.session_message_list import (
    SessionMessageListSerializer,
)
from games.serializers.games.sessions.messages.session_message_user import (
    SessionMessageUserSerializer,
)
from games.serializers.games.tasks.game_task_create import GameTaskCreateSerializer
from games.serializers.games.tasks.game_task_list import GameTaskListSerializer
from games.serializers.games.tasks.game_task_update import GameTaskUpdateSerializer
from games.serializers.games.treasures.game_treasure_update import GameTreasureUpdateSerializer
from games.serializers.link import LinkSerializer
from games.serializers.photo_upload import PhotoUploadSerializer
from games.serializers.staff.staff_user_detail import StaffUserDetailSerializer
from games.serializers.staff.staff_user_list import StaffUserListSerializer
from games.serializers.staff.staff_user_update import StaffUserUpdateSerializer
from games.serializers.treasures.treasure_access import TreasureAccessSerializer
from games.serializers.treasures.treasure_create import TreasureCreateSerializer
from games.serializers.treasures.treasure_detail import TreasureDetailSerializer
from games.serializers.treasures.treasure_list import (
    TreasureAllListSerializer,
    TreasureListSerializer,
)
from games.serializers.treasures.treasure_permissions import TreasurePermissionsSerializer
from games.serializers.treasures.treasure_update import TreasureUpdateSerializer

__all__ = [
    'BaseAccessSerializer',
    'BasePermissionsSerializer',
    'CharacterAccessSerializer',
    'CharacterCreateSerializer',
    'CharacterDetailSerializer',
    'CharacterFullListSerializer',
    'CharacterFullSerializer',
    'CharacterLinkSerializer',
    'CharacterLinkWriteSerializer',
    'CharacterListSerializer',
    'CharacterMoneyUpdateSerializer',
    'CharacterPermissionsSerializer',
    'CharacterPhotoSerializer',
    'CharacterTreasureAllSerializer',
    'CharacterTreasureSerializer',
    'CharacterUpdateSerializer',
    'GameAccessSerializer',
    'GameCreateSerializer',
    'GameDetailSerializer',
    'GameListSerializer',
    'GameMasterSerializer',
    'GamePermissionsSerializer',
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
    'NpcPlayerUpdateSerializer',
    'PcAccessSerializer',
    'PhotoUploadSerializer',
    'PollCreateSerializer',
    'PollDetailSerializer',
    'PollListSerializer',
    'PollOptionSerializer',
    'PollOptionVoteCountSerializer',
    'PollOptionWriteSerializer',
    'PollVoteSerializer',
    'PollVoteUserSerializer',
    'PollVoteWriteSerializer',
    'SessionMessageCreateSerializer',
    'SessionMessageListSerializer',
    'SessionMessageUserSerializer',
    'SessionPollCreateSerializer',
    'StaffUserDetailSerializer',
    'StaffUserListSerializer',
    'StaffUserUpdateSerializer',
    'TreasureAccessSerializer',
    'TreasureAllListSerializer',
    'TreasureCreateSerializer',
    'TreasureDetailSerializer',
    'TreasureListSerializer',
    'TreasurePermissionsSerializer',
    'TreasureUpdateSerializer',
]
