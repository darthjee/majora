import React from 'react';
import ListPage from '../../../../common/list_page/ListPage.jsx';
import PageActions from '../../../../common/list_page/PageActions.jsx';
import ConditionalComponent from '../../../../common/misc/ConditionalComponent.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the Game Factions listing page (issue #812), mirroring
 * `GameItemsHelper`/`GameCharactersHelper` — header (back button, "Create Faction" action gated
 * on `state.canCreateFaction`, heading) and the shared `ListPage` grid (type `factions`). No
 * filter bar, mirroring `items`' own `ListPage` usage — no i18n keys were provisioned for one.
 */
export default class GameFactionsHelper {
  /**
   * Render the factions page.
   *
   * @param {object} state - Page state.
   * @param {string} state.gameSlug - Current game slug.
   * @param {string} state.basePath - Base hash path for the factions list.
   * @param {string} state.backHref - Hash path to the parent game page.
   * @param {boolean} state.canCreateFaction - Whether the current user may create a new faction
   *   (issue #812 — `regular` tier, staff and any player of the game), gating the "Create
   *   Faction" button.
   * @param {number} state.refreshToken - Opaque value bumped to re-trigger the list fetch (e.g.
   *   after the "New Faction" modal succeeds).
   * @param {object} handlers - Page event handlers.
   * @param {Function} handlers.onNewClick - Called when the "Create Faction" button is clicked.
   * @returns {React.ReactElement} Rendered factions page.
   */
  static render(state, handlers) {
    return (
      <>
        <div className="container mt-4">
          <PageActions backHref={state.backHref}>
            {GameFactionsHelper.#renderNewButton(state, handlers)}
          </PageActions>
          <h1 className="mb-4">{Translator.t('game_factions_page.title')}</h1>
        </div>
        <ListPage
          type="factions"
          gameSlug={state.gameSlug}
          basePath={state.basePath}
          loadingMessage={Translator.t('game_factions_page.loading')}
          refreshToken={state.refreshToken}
        />
      </>
    );
  }

  static #renderNewButton(state, handlers) {
    return (
      <ConditionalComponent render={state.canCreateFaction}>
        <button type="button" className="btn btn-primary mb-3" onClick={handlers.onNewClick}>
          {Translator.t('game_factions_page.new_faction')}
        </button>
      </ConditionalComponent>
    );
  }
}
