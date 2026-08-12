import React from 'react';
import Header from '../common/header/Header.jsx';
import Game from '../resources/game/pages/Game.jsx';
import GameEdit from '../resources/game/pages/GameEdit.jsx';
import GameNew from '../resources/game/pages/GameNew.jsx';
import GameNpcNew from '../resources/character/pages/GameNpcNew.jsx';
import GameNpcs from '../resources/character/pages/GameNpcs.jsx';
import GamePcs from '../resources/character/pages/GamePcs.jsx';
import GamePhotos from '../resources/game/pages/GamePhotos.jsx';
import GamePlayer from '../resources/player/pages/GamePlayer.jsx';
import GamePlayers from '../resources/player/pages/GamePlayers.jsx';
import GamePoll from '../resources/game/pages/GamePoll.jsx';
import GamePollNew from '../resources/game/pages/GamePollNew.jsx';
import GamePolls from '../resources/game/pages/GamePolls.jsx';
import GameSession from '../resources/game_session/pages/GameSession.jsx';
import GameSessionEdit from '../resources/game_session/pages/GameSessionEdit.jsx';
import GameSessionNew from '../resources/game_session/pages/GameSessionNew.jsx';
import GameSessions from '../resources/game_session/pages/GameSessions.jsx';
import GameTasks from '../resources/game/pages/GameTasks.jsx';
import GameItem from '../resources/item/pages/GameItem.jsx';
import GameItemEdit from '../resources/item/pages/GameItemEdit.jsx';
import GameItemNew from '../resources/item/pages/GameItemNew.jsx';
import GameItems from '../resources/item/pages/GameItems.jsx';
import GamePossession from '../resources/possession/pages/GamePossession.jsx';
import GamePossessionEdit from '../resources/possession/pages/GamePossessionEdit.jsx';
import GamePossessionNew from '../resources/possession/pages/GamePossessionNew.jsx';
import GamePossessions from '../resources/possession/pages/GamePossessions.jsx';
import GameDocument from '../resources/document/pages/GameDocument.jsx';
import GameDocumentEdit from '../resources/document/pages/GameDocumentEdit.jsx';
import GameDocumentNew from '../resources/document/pages/GameDocumentNew.jsx';
import GameDocuments from '../resources/document/pages/GameDocuments.jsx';
import GameDocumentPhotos from '../resources/document/pages/GameDocumentPhotos.jsx';
import GameDocumentFiles from '../resources/document/pages/GameDocumentFiles.jsx';
import GameTreasure from '../resources/treasure/pages/GameTreasure.jsx';
import GameTreasureEdit from '../resources/treasure/pages/GameTreasureEdit.jsx';
import GameTreasureNew from '../resources/treasure/pages/GameTreasureNew.jsx';
import GameTreasures from '../resources/treasure/pages/GameTreasures.jsx';
import Games from '../resources/game/pages/Games.jsx';
import AuthorizationRequests from '../resources/account/pages/AuthorizationRequests.jsx';
import MyAccount from '../resources/account/pages/MyAccount.jsx';
import MyGames from '../resources/game/pages/MyGames.jsx';
import NpcCharacter from '../resources/character/pages/NpcCharacter.jsx';
import NpcCharacterEdit from '../resources/character/pages/NpcCharacterEdit.jsx';
import NpcCharacterItem from '../resources/character/pages/NpcCharacterItem.jsx';
import NpcCharacterItemEdit from '../resources/character/pages/NpcCharacterItemEdit.jsx';
import NpcCharacterItemNew from '../resources/character/pages/NpcCharacterItemNew.jsx';
import NpcCharacterItems from '../resources/character/pages/NpcCharacterItems.jsx';
import NpcCharacterDocument from '../resources/character/pages/NpcCharacterDocument.jsx';
import NpcCharacterDocuments from '../resources/character/pages/NpcCharacterDocuments.jsx';
import NpcCharacterPhotos from '../resources/character/pages/NpcCharacterPhotos.jsx';
import NpcCharacterTreasures from '../resources/character/pages/NpcCharacterTreasures.jsx';
import PcCharacter from '../resources/character/pages/PcCharacter.jsx';
import PcCharacterEdit from '../resources/character/pages/PcCharacterEdit.jsx';
import PcCharacterItem from '../resources/character/pages/PcCharacterItem.jsx';
import PcCharacterItemEdit from '../resources/character/pages/PcCharacterItemEdit.jsx';
import PcCharacterItemNew from '../resources/character/pages/PcCharacterItemNew.jsx';
import PcCharacterItems from '../resources/character/pages/PcCharacterItems.jsx';
import PcCharacterDocument from '../resources/character/pages/PcCharacterDocument.jsx';
import PcCharacterDocuments from '../resources/character/pages/PcCharacterDocuments.jsx';
import PcCharacterPhotos from '../resources/character/pages/PcCharacterPhotos.jsx';
import PcCharacterTreasures from '../resources/character/pages/PcCharacterTreasures.jsx';
import RecoverPassword from '../resources/account/pages/RecoverPassword.jsx';
import Register from '../resources/account/pages/Register.jsx';
import StaffDashboard from '../resources/staff_dashboard/pages/StaffDashboard.jsx';
import StaffUser from '../resources/staff_user/pages/StaffUser.jsx';
import StaffUserEdit from '../resources/staff_user/pages/StaffUserEdit.jsx';
import StaffUsers from '../resources/staff_user/pages/StaffUsers.jsx';
import StlModel from '../resources/stl_model/pages/StlModel.jsx';
import StlModelEdit from '../resources/stl_model/pages/StlModelEdit.jsx';
import StlModelNew from '../resources/stl_model/pages/StlModelNew.jsx';
import StlModels from '../resources/stl_model/pages/StlModels.jsx';
import Source from '../resources/source/pages/Source.jsx';
import Sources from '../resources/source/pages/Sources.jsx';
import Collection from '../resources/collection/pages/Collection.jsx';
import Collections from '../resources/collection/pages/Collections.jsx';
import Treasure from '../resources/treasure/pages/Treasure.jsx';
import TreasureEdit from '../resources/treasure/pages/TreasureEdit.jsx';
import TreasureNew from '../resources/treasure/pages/TreasureNew.jsx';
import Treasures from '../resources/treasure/pages/Treasures.jsx';

const PAGES = {
  games: <Games />,
  accountAuthorizationRequests: <AuthorizationRequests />,
  game: <Game />,
  gameEdit: <GameEdit />,
  gameNew: <GameNew />,
  gamePcs: <GamePcs />,
  gameNpcs: <GameNpcs />,
  gameNpcNew: <GameNpcNew />,
  gamePhotos: <GamePhotos />,
  gamePlayer: <GamePlayer />,
  gamePlayers: <GamePlayers />,
  gamePolls: <GamePolls />,
  gamePollNew: <GamePollNew />,
  gamePoll: <GamePoll />,
  gameTreasures: <GameTreasures />,
  gameTreasureNew: <GameTreasureNew />,
  gameTreasureEdit: <GameTreasureEdit />,
  gameTreasure: <GameTreasure />,
  gameItem: <GameItem />,
  gameItemEdit: <GameItemEdit />,
  gameItemNew: <GameItemNew />,
  gameItems: <GameItems />,
  gamePossession: <GamePossession />,
  gamePossessionEdit: <GamePossessionEdit />,
  gamePossessionNew: <GamePossessionNew />,
  gamePossessions: <GamePossessions />,
  gameDocument: <GameDocument />,
  gameDocumentEdit: <GameDocumentEdit />,
  gameDocumentNew: <GameDocumentNew />,
  gameDocuments: <GameDocuments />,
  gameDocumentPhotos: <GameDocumentPhotos />,
  gameDocumentFiles: <GameDocumentFiles />,
  gameSessions: <GameSessions />,
  gameSessionNew: <GameSessionNew />,
  gameSession: <GameSession />,
  gameSessionEdit: <GameSessionEdit />,
  gameTasks: <GameTasks />,
  myAccount: <MyAccount />,
  myGames: <MyGames />,
  npcCharacter: <NpcCharacter />,
  npcCharacterEdit: <NpcCharacterEdit />,
  npcCharacterPhotos: <NpcCharacterPhotos />,
  npcCharacterTreasures: <NpcCharacterTreasures />,
  npcCharacterItems: <NpcCharacterItems />,
  npcCharacterItem: <NpcCharacterItem />,
  npcCharacterItemEdit: <NpcCharacterItemEdit />,
  npcCharacterItemNew: <NpcCharacterItemNew />,
  npcCharacterDocument: <NpcCharacterDocument />,
  npcCharacterDocuments: <NpcCharacterDocuments />,
  pcCharacter: <PcCharacter />,
  pcCharacterEdit: <PcCharacterEdit />,
  pcCharacterPhotos: <PcCharacterPhotos />,
  pcCharacterTreasures: <PcCharacterTreasures />,
  pcCharacterItems: <PcCharacterItems />,
  pcCharacterItem: <PcCharacterItem />,
  pcCharacterItemEdit: <PcCharacterItemEdit />,
  pcCharacterItemNew: <PcCharacterItemNew />,
  pcCharacterDocument: <PcCharacterDocument />,
  pcCharacterDocuments: <PcCharacterDocuments />,
  recoverPassword: <RecoverPassword />,
  register: <Register />,
  staffDashboard: <StaffDashboard />,
  staffUsers: <StaffUsers />,
  staffUser: <StaffUser />,
  staffUserEdit: <StaffUserEdit />,
  stlModels: <StlModels />,
  stlModel: <StlModel />,
  stlModelNew: <StlModelNew />,
  stlModelEdit: <StlModelEdit />,
  sources: <Sources />,
  source: <Source />,
  collections: <Collections />,
  collection: <Collection />,
  treasures: <Treasures />,
  treasure: <Treasure />,
  treasureNew: <TreasureNew />,
  treasureEdit: <TreasureEdit />,
  home: <Games />,
};

/**
 * Helper for application page rendering.
 */
export default class AppHelper {
  /**
   * Render the app shell with current page.
   *
   * @param {string} page - Page key.
   * @param {string} hash - Current hash.
   * @param {string} [lang] - Current language code.
   * @param {number} [loadVersion] - Counter bumped on each translation chunk load.
   * @returns {React.ReactElement} App element tree.
   */
  static render(page, hash = '', lang = '', loadVersion = 0) {
    return (
      <div className="app">
        <Header>
          <React.Fragment key={`${hash}:${lang}:${loadVersion}`}>
            {PAGES[page] ?? PAGES.home}
          </React.Fragment>
        </Header>
      </div>
    );
  }
}
