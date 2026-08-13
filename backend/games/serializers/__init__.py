"""Serializers package for the games app."""

from games.serializers.base_access import BaseAccessSerializer
from games.serializers.base_permissions import BasePermissionsSerializer
from games.serializers.characters.character_access import CharacterAccessSerializer
from games.serializers.characters.character_create import CharacterCreateSerializer
from games.serializers.characters.character_detail import CharacterDetailSerializer
from games.serializers.characters.character_document import (
    CharacterDocumentAllSerializer,
    CharacterDocumentSerializer,
)
from games.serializers.characters.character_document_file import (
    CharacterDocumentFileSerializer,
)
from games.serializers.characters.character_document_photo import (
    CharacterDocumentPhotoSerializer,
)
from games.serializers.characters.character_full import CharacterFullSerializer
from games.serializers.characters.character_full_list import CharacterFullListSerializer
from games.serializers.characters.character_item import (
    CharacterItemAllSerializer,
    CharacterItemDetailFullSerializer,
    CharacterItemDetailSerializer,
    CharacterItemSerializer,
)
from games.serializers.characters.character_item_update import CharacterItemUpdateSerializer
from games.serializers.characters.character_link import CharacterLinkSerializer
from games.serializers.characters.character_link_write import CharacterLinkWriteSerializer
from games.serializers.characters.character_list import CharacterListSerializer
from games.serializers.characters.character_permissions import CharacterPermissionsSerializer
from games.serializers.characters.character_photo import CharacterPhotoSerializer
from games.serializers.characters.character_possession import (
    CharacterPossessionAllSerializer,
    CharacterPossessionSerializer,
)
from games.serializers.characters.character_regular_update import (
    CharacterRegularUpdateSerializer,
)
from games.serializers.characters.character_treasure import (
    CharacterTreasureAllSerializer,
    CharacterTreasureSerializer,
)
from games.serializers.characters.character_update import CharacterUpdateSerializer
from games.serializers.characters.npcs.npc_player_create import NpcPlayerCreateSerializer
from games.serializers.characters.npcs.npc_player_update import NpcPlayerUpdateSerializer
from games.serializers.characters.pcs.pc_access import PcAccessSerializer
from games.serializers.games.conversations.conversation_list import ConversationListSerializer
from games.serializers.games.documents.game_document_file import GameDocumentFileSerializer
from games.serializers.games.documents.game_document_list import (
    GameDocumentAllListSerializer,
    GameDocumentDetailFullSerializer,
    GameDocumentDetailSerializer,
    GameDocumentListSerializer,
)
from games.serializers.games.documents.game_document_permissions import (
    GameDocumentPermissionsSerializer,
)
from games.serializers.games.documents.game_document_photo import GameDocumentPhotoSerializer
from games.serializers.games.documents.game_document_update import GameDocumentUpdateSerializer
from games.serializers.games.factions.faction_list import FactionListSerializer
from games.serializers.games.factions.faction_photo import FactionPhotoSerializer
from games.serializers.games.factions.faction_update import FactionUpdateSerializer
from games.serializers.games.factions.game_faction_permissions import (
    GameFactionPermissionsSerializer,
)
from games.serializers.games.game_access import GameAccessSerializer
from games.serializers.games.game_create import GameCreateSerializer
from games.serializers.games.game_detail import GameDetailSerializer
from games.serializers.games.game_link import GameLinkSerializer
from games.serializers.games.game_link_write import GameLinkWriteSerializer
from games.serializers.games.game_list import GameListSerializer
from games.serializers.games.game_permissions import GamePermissionsSerializer
from games.serializers.games.game_photo import GamePhotoSerializer
from games.serializers.games.game_regular_update import GameRegularUpdateSerializer
from games.serializers.games.game_update import GameUpdateSerializer
from games.serializers.games.items.game_item_list import (
    GameItemAllListSerializer,
    GameItemDetailFullSerializer,
    GameItemDetailSerializer,
    GameItemListSerializer,
)
from games.serializers.games.items.game_item_permissions import GameItemPermissionsSerializer
from games.serializers.games.items.game_item_photo import GameItemPhotoSerializer
from games.serializers.games.items.game_item_update import GameItemUpdateSerializer
from games.serializers.games.my_games.my_games_item import MyGamesItemSerializer
from games.serializers.games.players.player_character import PlayerCharacterSerializer
from games.serializers.games.players.player_list import PlayerListSerializer
from games.serializers.games.players.player_user import PlayerUserSerializer
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
from games.serializers.games.possessions.game_possession_list import (
    GamePossessionAllListSerializer,
    GamePossessionDetailFullSerializer,
    GamePossessionDetailSerializer,
    GamePossessionListSerializer,
)
from games.serializers.games.possessions.game_possession_permissions import (
    GamePossessionPermissionsSerializer,
)
from games.serializers.games.possessions.game_possession_photo import (
    GamePossessionPhotoSerializer,
)
from games.serializers.games.possessions.game_possession_update import (
    GamePossessionUpdateSerializer,
)
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
from games.serializers.games.treasures.game_treasure_link import GameTreasureLinkSerializer
from games.serializers.games.treasures.game_treasure_update import GameTreasureUpdateSerializer
from games.serializers.photo_upload import FileUploadSerializer, PhotoUploadSerializer
from games.serializers.treasures.hidden_field import HiddenFieldSerializer
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
    'CharacterDocumentAllSerializer',
    'CharacterDocumentFileSerializer',
    'CharacterDocumentPhotoSerializer',
    'CharacterDocumentSerializer',
    'CharacterFullListSerializer',
    'CharacterFullSerializer',
    'CharacterItemAllSerializer',
    'CharacterItemDetailFullSerializer',
    'CharacterItemDetailSerializer',
    'CharacterItemSerializer',
    'CharacterItemUpdateSerializer',
    'CharacterLinkSerializer',
    'CharacterLinkWriteSerializer',
    'CharacterListSerializer',
    'CharacterPermissionsSerializer',
    'CharacterPhotoSerializer',
    'CharacterPossessionAllSerializer',
    'CharacterPossessionSerializer',
    'CharacterRegularUpdateSerializer',
    'CharacterTreasureAllSerializer',
    'CharacterTreasureSerializer',
    'CharacterUpdateSerializer',
    'ConversationListSerializer',
    'FactionListSerializer',
    'FactionPhotoSerializer',
    'FactionUpdateSerializer',
    'FileUploadSerializer',
    'GameAccessSerializer',
    'GameCreateSerializer',
    'GameDetailSerializer',
    'GameDocumentAllListSerializer',
    'GameDocumentDetailFullSerializer',
    'GameDocumentDetailSerializer',
    'GameDocumentFileSerializer',
    'GameDocumentListSerializer',
    'GameDocumentPermissionsSerializer',
    'GameDocumentPhotoSerializer',
    'GameDocumentUpdateSerializer',
    'GameFactionPermissionsSerializer',
    'GameItemAllListSerializer',
    'GameItemDetailFullSerializer',
    'GameItemDetailSerializer',
    'GameItemListSerializer',
    'GameItemPermissionsSerializer',
    'GameItemPhotoSerializer',
    'GameItemUpdateSerializer',
    'GameLinkSerializer',
    'GameLinkWriteSerializer',
    'GameListSerializer',
    'GamePermissionsSerializer',
    'GamePhotoSerializer',
    'GamePossessionAllListSerializer',
    'GamePossessionDetailFullSerializer',
    'GamePossessionDetailSerializer',
    'GamePossessionListSerializer',
    'GamePossessionPermissionsSerializer',
    'GamePossessionPhotoSerializer',
    'GamePossessionUpdateSerializer',
    'GameRegularUpdateSerializer',
    'GameSessionCreateSerializer',
    'GameSessionDetailSerializer',
    'GameSessionListSerializer',
    'GameSessionUpdateSerializer',
    'GameTaskCreateSerializer',
    'GameTaskListSerializer',
    'GameTaskUpdateSerializer',
    'GameTreasureLinkSerializer',
    'GameTreasureUpdateSerializer',
    'GameUpdateSerializer',
    'HiddenFieldSerializer',
    'MyGamesItemSerializer',
    'NpcPlayerCreateSerializer',
    'NpcPlayerUpdateSerializer',
    'PcAccessSerializer',
    'PhotoUploadSerializer',
    'PlayerCharacterSerializer',
    'PlayerListSerializer',
    'PlayerUserSerializer',
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
    'TreasureAccessSerializer',
    'TreasureAllListSerializer',
    'TreasureCreateSerializer',
    'TreasureDetailSerializer',
    'TreasureListSerializer',
    'TreasurePermissionsSerializer',
    'TreasureUpdateSerializer',
]
