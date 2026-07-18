import React from 'react';
import PageActions from '../../../../common/list_page/PageActions.jsx';
import ListPage from '../../../../common/list_page/ListPage.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the Game Players roster listing page.
 */
export default class GamePlayersHelper {
  /**
   * Render the players page: header (back button, heading) and the shared `ListPage` grid
   * (type `players`). Read-only: players have no "New"/upload affordance on this page.
   *
   * @param {string} gameSlug - Game slug the players belong to.
   * @returns {React.ReactElement} Rendered players page.
   */
  static render(gameSlug) {
    const basePath = `#/games/${gameSlug}/players`;
    const backHref = `#/games/${gameSlug}`;

    return (
      <>
        <div className="container mt-4">
          <PageActions backHref={backHref} />
          <h1 className="mb-4">{Translator.t('game_page.players')}</h1>
        </div>
        <ListPage
          type="players"
          gameSlug={gameSlug}
          basePath={basePath}
          loadingMessage={Translator.t('game_players_page.loading')}
        />
      </>
    );
  }
}
