import React from 'react';
import ListPage from '../../../../common/list_page/ListPage.jsx';
import PageActions from '../../../../common/list_page/PageActions.jsx';
import UploadButton from '../../../../common/buttons/UploadButton.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the Character Treasures (PC and NPC) listing page.
 */
export default class CharacterTreasuresHelper {
  /**
   * Render the treasures page: header (back button, "Exchange Treasure" action gated on
   * `canEdit`, heading) and the shared `ListPage` grid (type `pc-treasures`/`npc-treasures`).
   *
   * @param {object} state - Page state.
   * @param {string} state.gameSlug - Game slug the character belongs to.
   * @param {string} state.listType - `listTypeConfig` key for this character kind
   *   (`'pc-treasures'`/`'npc-treasures'`).
   * @param {string} state.basePath - Base hash path for the treasures list.
   * @param {string} state.backHref - Hash path to the parent character page.
   * @param {boolean} [state.canEdit] - Whether the current user may buy/sell treasures.
   * @param {number} state.refreshToken - Opaque value bumped to re-trigger the list fetch.
   * @param {object} state.activeFilters - Active filter query params preserved on pagination links.
   * @param {object} handlers - Page event handlers.
   * @param {Function} handlers.onAddTreasure - Handler invoked when the "Exchange Treasure" button is clicked.
   * @param {Function} handlers.onFilterQuery - Called with the built filter query object.
   * @param {Function} handlers.onFilterClear - Called when the filters are cleared.
   * @param {Function} handlers.onItemsChange - Called with the freshly fetched raw treasures,
   *   so the owning page can cross-reference them in the exchange modal.
   * @returns {React.ReactElement} Rendered treasures page.
   */
  static render(state, handlers) {
    return (
      <>
        <div className="container mt-4">
          <PageActions backHref={state.backHref}>
            {CharacterTreasuresHelper.#renderAddButton(state, handlers)}
          </PageActions>
          <h1 className="mb-4">{Translator.t('character_treasures_page.title')}</h1>
        </div>
        <ListPage
          type={state.listType}
          gameSlug={state.gameSlug}
          basePath={state.basePath}
          loadingMessage={Translator.t('character_treasures_page.loading')}
          filtersProps={{
            onQuery: handlers.onFilterQuery, onClear: handlers.onFilterClear, showGameType: false,
          }}
          activeFilters={state.activeFilters}
          refreshToken={state.refreshToken}
          onItemsChange={handlers.onItemsChange}
        />
      </>
    );
  }

  static #renderAddButton(state, handlers) {
    if (!state.canEdit) return null;

    return (
      <UploadButton onClick={handlers.onAddTreasure}>
        {Translator.t('character_treasures_page.add_treasure')}
      </UploadButton>
    );
  }
}
