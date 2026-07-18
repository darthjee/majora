import React from 'react';
import ListPage from '../../../../common/ListPage.jsx';
import NewButton from '../../../../common/NewButton.jsx';
import PageActions from '../../../../common/PageActions.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the Games listing page.
 */
export default class GamesHelper {
  /**
   * Render the games page: header (back button, "New Game" action, gated on `loggedIn`) and the
   * shared `ListPage` grid (type `games`).
   *
   * @param {boolean} loggedIn - Whether the current user is logged in, gating the "New Game" button.
   * @returns {React.ReactElement} Rendered games page.
   */
  static render(loggedIn) {
    return (
      <>
        <div className="container mt-4">
          <PageActions backHref="#/">
            {loggedIn && (
              <NewButton href="#/games/new">
                {Translator.t('games_page.new_game')}
              </NewButton>
            )}
          </PageActions>
        </div>
        <ListPage
          type="games"
          basePath="#/games"
          loadingMessage={Translator.t('games_page.loading')}
        />
      </>
    );
  }
}
