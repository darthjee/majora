import React from 'react';
import PageActions from '../../../../common/list_page/PageActions.jsx';
import NewButton from '../../../../common/buttons/NewButton.jsx';
import ListPage from '../../../../common/list_page/ListPage.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the Game Common Items listing page (issue #826), mirroring
 * `GamePossessionsHelper`.
 */
export default class GameCommonItemsHelper {
  /**
   * Render the common items page: header (back button, "Create Common Item" action gated on
   * `state.canCreateCommonItem`, heading) and the shared `ListPage` grid (type `commonItems`).
   * The list itself has no per-row edit/upload actions; common item creation is the only
   * DM/admin/staff-gated action on this page.
   *
   * @param {object} state - Page state.
   * @param {string} state.gameSlug - Current game slug.
   * @param {string} state.basePath - Base hash path for the common items list.
   * @param {string} state.backHref - Hash path to the parent game page.
   * @param {string} state.newHref - Hash path to the new common item form.
   * @param {boolean} state.canCreateCommonItem - Whether the current user may create a new
   *   common item.
   * @param {number} state.refreshToken - Opaque value bumped to re-trigger the list fetch.
   * @param {object} state.activeFilters - Active filter query params preserved on pagination
   *   links.
   * @param {object} handlers - Page event handlers.
   * @param {Function} handlers.onFilterQuery - Called with the built filter query object.
   * @param {Function} handlers.onFilterClear - Called when the filters are cleared.
   * @returns {React.ReactElement} Rendered common items page.
   */
  static render(state, handlers) {
    return (
      <>
        <div className="container mt-4">
          <PageActions backHref={state.backHref}>
            {GameCommonItemsHelper.#renderNewButton(state)}
          </PageActions>
          <h1 className="mb-4">{Translator.t('game_common_items_page.title')}</h1>
        </div>
        <ListPage
          type="commonItems"
          gameSlug={state.gameSlug}
          basePath={state.basePath}
          loadingMessage={Translator.t('game_common_items_page.loading')}
          filters={{
            props: { onQuery: handlers.onFilterQuery, onClear: handlers.onFilterClear },
            active: state.activeFilters,
          }}
          refreshToken={state.refreshToken}
        />
      </>
    );
  }

  static #renderNewButton(state) {
    if (!state.canCreateCommonItem) {
      return null;
    }

    return (
      <NewButton href={state.newHref}>
        {Translator.t('game_common_items_page.create_common_item')}
      </NewButton>
    );
  }
}
