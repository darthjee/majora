import React from 'react';
import PageActions from '../../../../common/PageActions.jsx';
import ListPage from '../../../../common/ListPage.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the Game Items listing page.
 */
export default class GameItemsHelper {
  /**
   * Render the items page: header (back button, heading) and the shared `ListPage` grid
   * (type `items`). Read-only (issue #658): no "New"/"Add" action or upload modal, unlike
   * `GameTreasuresHelper`.
   *
   * @param {object} state - Page state.
   * @param {string} state.gameSlug - Current game slug.
   * @param {string} state.basePath - Base hash path for the items list.
   * @param {string} state.backHref - Hash path to the parent game page.
   * @returns {React.ReactElement} Rendered items page.
   */
  static render(state) {
    return (
      <>
        <div className="container mt-4">
          <PageActions backHref={state.backHref} />
          <h1 className="mb-4">{Translator.t('game_items_page.title')}</h1>
        </div>
        <ListPage
          type="items"
          gameSlug={state.gameSlug}
          basePath={state.basePath}
          loadingMessage={Translator.t('game_items_page.loading')}
        />
      </>
    );
  }
}
