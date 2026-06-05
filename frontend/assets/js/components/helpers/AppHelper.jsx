import React from 'react';
import Header from '../elements/Header.jsx';
import Character from '../pages/Character.jsx';
import Game from '../pages/Game.jsx';
import GameNpcs from '../pages/GameNpcs.jsx';
import GamePcs from '../pages/GamePcs.jsx';
import Games from '../pages/Games.jsx';

const PAGES = {
  games: <Games />,
  game: <Game />,
  gamePcs: <GamePcs />,
  gameNpcs: <GameNpcs />,
  character: <Character />,
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
