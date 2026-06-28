import React from 'react';
import Header from '../elements/Header.jsx';
import Game from '../pages/Game.jsx';
import GameEdit from '../pages/GameEdit.jsx';
import GameNew from '../pages/GameNew.jsx';
import GameNpcs from '../pages/GameNpcs.jsx';
import GamePcs from '../pages/GamePcs.jsx';
import Games from '../pages/Games.jsx';
import NpcCharacter from '../pages/NpcCharacter.jsx';
import NpcCharacterEdit from '../pages/NpcCharacterEdit.jsx';
import PcCharacter from '../pages/PcCharacter.jsx';
import PcCharacterEdit from '../pages/PcCharacterEdit.jsx';
import RecoverPassword from '../pages/RecoverPassword.jsx';
import Register from '../pages/Register.jsx';

const PAGES = {
  games: <Games />,
  game: <Game />,
  gameEdit: <GameEdit />,
  gameNew: <GameNew />,
  gamePcs: <GamePcs />,
  gameNpcs: <GameNpcs />,
  npcCharacter: <NpcCharacter />,
  npcCharacterEdit: <NpcCharacterEdit />,
  pcCharacter: <PcCharacter />,
  pcCharacterEdit: <PcCharacterEdit />,
  recoverPassword: <RecoverPassword />,
  register: <Register />,
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
