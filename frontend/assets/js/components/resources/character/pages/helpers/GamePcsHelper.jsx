import React from 'react';
import PageActions from '../../../../common/list_page/PageActions.jsx';
import ListPage from '../../../../common/list_page/ListPage.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the Game PCs listing page.
 */
export default class GamePcsHelper {
  /**
   * Render the PCs page: header (back button, heading) and the shared `ListPage` grid
   * (type `pcs`). Read-only: PCs have no "New"/upload affordance on this page today.
   *
   * @param {string} gameSlug - Game slug the PCs belong to.
   * @returns {React.ReactElement} Rendered PCs page.
   */
  static render(gameSlug) {
    const basePath = `#/games/${gameSlug}/pcs`;
    const backHref = `#/games/${gameSlug}`;

    return (
      <>
        <div className="container mt-4">
          <PageActions backHref={backHref} />
          <h1 className="mb-4">Player Characters</h1>
        </div>
        <ListPage
          type="pcs"
          gameSlug={gameSlug}
          basePath={basePath}
          loadingMessage={Translator.t('game_characters_page.loading')}
        />
      </>
    );
  }
}
