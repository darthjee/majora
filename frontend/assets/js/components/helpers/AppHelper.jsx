import React from 'react';
import Header from '../elements/Header.jsx';
import Game from '../pages/Game.jsx';
import GameEdit from '../pages/GameEdit.jsx';
import GameNew from '../pages/GameNew.jsx';
import GameNpcNew from '../pages/GameNpcNew.jsx';
import GameNpcs from '../pages/GameNpcs.jsx';
import GamePcs from '../pages/GamePcs.jsx';
import GamePhotos from '../pages/GamePhotos.jsx';
import GameSession from '../pages/GameSession.jsx';
import GameSessionEdit from '../pages/GameSessionEdit.jsx';
import GameSessionNew from '../pages/GameSessionNew.jsx';
import GameSessions from '../pages/GameSessions.jsx';
import GameTasks from '../pages/GameTasks.jsx';
import GameTreasureEdit from '../pages/GameTreasureEdit.jsx';
import GameTreasureNew from '../pages/GameTreasureNew.jsx';
import GameTreasures from '../pages/GameTreasures.jsx';
import Games from '../pages/Games.jsx';
import MyAccount from '../resources/account/pages/MyAccount.jsx';
import NpcCharacter from '../pages/NpcCharacter.jsx';
import NpcCharacterEdit from '../pages/NpcCharacterEdit.jsx';
import NpcCharacterPhotos from '../pages/NpcCharacterPhotos.jsx';
import NpcCharacterTreasures from '../pages/NpcCharacterTreasures.jsx';
import PcCharacter from '../pages/PcCharacter.jsx';
import PcCharacterEdit from '../pages/PcCharacterEdit.jsx';
import PcCharacterPhotos from '../pages/PcCharacterPhotos.jsx';
import PcCharacterTreasures from '../pages/PcCharacterTreasures.jsx';
import RecoverPassword from '../resources/account/pages/RecoverPassword.jsx';
import Register from '../resources/account/pages/Register.jsx';
import StaffUser from '../resources/staff_user/pages/StaffUser.jsx';
import StaffUserEdit from '../resources/staff_user/pages/StaffUserEdit.jsx';
import StaffUsers from '../resources/staff_user/pages/StaffUsers.jsx';
import Treasure from '../pages/Treasure.jsx';
import TreasureEdit from '../pages/TreasureEdit.jsx';
import TreasureNew from '../pages/TreasureNew.jsx';
import Treasures from '../pages/Treasures.jsx';

const PAGES = {
  games: <Games />,
  game: <Game />,
  gameEdit: <GameEdit />,
  gameNew: <GameNew />,
  gamePcs: <GamePcs />,
  gameNpcs: <GameNpcs />,
  gameNpcNew: <GameNpcNew />,
  gamePhotos: <GamePhotos />,
  gameTreasures: <GameTreasures />,
  gameTreasureNew: <GameTreasureNew />,
  gameTreasureEdit: <GameTreasureEdit />,
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
  pcCharacter: <PcCharacter />,
  pcCharacterEdit: <PcCharacterEdit />,
  pcCharacterPhotos: <PcCharacterPhotos />,
  pcCharacterTreasures: <PcCharacterTreasures />,
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
