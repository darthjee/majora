import React from 'react';
import Header from '../elements/Header.jsx';
import Game from '../pages/Game.jsx';
import GameNpcs from '../pages/GameNpcs.jsx';
import GamePcs from '../pages/GamePcs.jsx';
import Games from '../pages/Games.jsx';
import NpcCharacter from '../pages/NpcCharacter.jsx';
import PcCharacter from '../pages/PcCharacter.jsx';

const PAGES = {
  games: <Games />,
  game: <Game />,
  gamePcs: <GamePcs />,
  gameNpcs: <GameNpcs />,
  npcCharacter: <NpcCharacter />,
  pcCharacter: <PcCharacter />,
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
   * @returns {React.ReactElement} App element tree.
   */
  static render(page, hash = '') {
    return (
      <div className="app">
        <Header />
        <React.Fragment key={hash}>
          {PAGES[page] ?? PAGES.home}
        </React.Fragment>
      </div>
    );
  }
}
