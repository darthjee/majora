import React from 'react';
import Header from '../common/header/Header.jsx';
import Game from '../resources/game/pages/Game.jsx';
import GameEdit from '../resources/game/pages/GameEdit.jsx';
import GameNew from '../resources/game/pages/GameNew.jsx';
import GameNpcNew from '../resources/character/pages/GameNpcNew.jsx';
import GameNpcs from '../resources/character/pages/GameNpcs.jsx';
import GamePcs from '../resources/character/pages/GamePcs.jsx';
import GamePhotos from '../resources/game/pages/GamePhotos.jsx';
import GamePoll from '../resources/game/pages/GamePoll.jsx';
import GamePollNew from '../resources/game/pages/GamePollNew.jsx';
import GamePolls from '../resources/game/pages/GamePolls.jsx';
import GameSession from '../resources/game_session/pages/GameSession.jsx';
import GameSessionEdit from '../resources/game_session/pages/GameSessionEdit.jsx';
import GameSessionNew from '../resources/game_session/pages/GameSessionNew.jsx';
import GameSessions from '../resources/game_session/pages/GameSessions.jsx';
import GameTasks from '../resources/game/pages/GameTasks.jsx';
import GameItems from '../resources/item/pages/GameItems.jsx';
import GameTreasureEdit from '../resources/treasure/pages/GameTreasureEdit.jsx';
import GameTreasureNew from '../resources/treasure/pages/GameTreasureNew.jsx';
import GameTreasures from '../resources/treasure/pages/GameTreasures.jsx';
import Games from '../resources/game/pages/Games.jsx';
import MyAccount from '../resources/account/pages/MyAccount.jsx';
import NpcCharacter from '../resources/character/pages/NpcCharacter.jsx';
import NpcCharacterEdit from '../resources/character/pages/NpcCharacterEdit.jsx';
import NpcCharacterItems from '../resources/character/pages/NpcCharacterItems.jsx';
import NpcCharacterPhotos from '../resources/character/pages/NpcCharacterPhotos.jsx';
import NpcCharacterTreasures from '../resources/character/pages/NpcCharacterTreasures.jsx';
import PcCharacter from '../resources/character/pages/PcCharacter.jsx';
import PcCharacterEdit from '../resources/character/pages/PcCharacterEdit.jsx';
import PcCharacterItems from '../resources/character/pages/PcCharacterItems.jsx';
import PcCharacterPhotos from '../resources/character/pages/PcCharacterPhotos.jsx';
import PcCharacterTreasures from '../resources/character/pages/PcCharacterTreasures.jsx';
import RecoverPassword from '../resources/account/pages/RecoverPassword.jsx';
import Register from '../resources/account/pages/Register.jsx';
import StaffUser from '../resources/staff_user/pages/StaffUser.jsx';
import StaffUserEdit from '../resources/staff_user/pages/StaffUserEdit.jsx';
import StaffUsers from '../resources/staff_user/pages/StaffUsers.jsx';
import Treasure from '../resources/treasure/pages/Treasure.jsx';
import TreasureEdit from '../resources/treasure/pages/TreasureEdit.jsx';
import TreasureNew from '../resources/treasure/pages/TreasureNew.jsx';
import Treasures from '../resources/treasure/pages/Treasures.jsx';

const PAGES = {
  games: <Games />,
  game: <Game />,
  gameEdit: <GameEdit />,
  gameNew: <GameNew />,
  gamePcs: <GamePcs />,
  gameNpcs: <GameNpcs />,
  gameNpcNew: <GameNpcNew />,
  gamePhotos: <GamePhotos />,
  gamePolls: <GamePolls />,
  gamePollNew: <GamePollNew />,
  gamePoll: <GamePoll />,
  gameTreasures: <GameTreasures />,
  gameTreasureNew: <GameTreasureNew />,
  gameTreasureEdit: <GameTreasureEdit />,
  gameItems: <GameItems />,
  gameSessions: <GameSessions />,
  gameSessionNew: <GameSessionNew />,
  gameSession: <GameSession />,
  gameSessionEdit: <GameSessionEdit />,
  gameTasks: <GameTasks />,
  myAccount: <MyAccount />,
  npcCharacter: <NpcCharacter />,
  npcCharacterEdit: <NpcCharacterEdit />,
  npcCharacterPhotos: <NpcCharacterPhotos />,
  npcCharacterTreasures: <NpcCharacterTreasures />,
  npcCharacterItems: <NpcCharacterItems />,
  pcCharacter: <PcCharacter />,
  pcCharacterEdit: <PcCharacterEdit />,
  pcCharacterPhotos: <PcCharacterPhotos />,
  pcCharacterTreasures: <PcCharacterTreasures />,
  pcCharacterItems: <PcCharacterItems />,
  recoverPassword: <RecoverPassword />,
  register: <Register />,
  staffUsers: <StaffUsers />,
  staffUser: <StaffUser />,
  staffUserEdit: <StaffUserEdit />,
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
   * @returns {React.ReactElement} App element tree.
   */
  static render(page, hash = '', lang = '') {
    return (
      <div className="app">
        <Header />
        <React.Fragment key={`${hash}:${lang}`}>
          {PAGES[page] ?? PAGES.home}
        </React.Fragment>
      </div>
    );
  }
}
