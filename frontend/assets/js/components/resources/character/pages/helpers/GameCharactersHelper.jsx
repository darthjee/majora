import React from 'react';
import ConditionalComponent from '../../../../common/ConditionalComponent.jsx';
import ListPage from '../../../../common/ListPage.jsx';
import NewButton from '../../../../common/NewButton.jsx';
import PageActions from '../../../../common/PageActions.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the Game NPCs listing page (NPC-only; PCs render through the separate
 * `GamePcsHelper`, since their page chrome no longer overlaps once both are backed by the
 * shared `ListPage`/`listTypeConfig` abstraction).
 */
export default class GameCharactersHelper {
  /**
   * Render the NPCs page: header (back button, "New NPC" action gated on `canEdit`, heading)
   * and the shared `ListPage` grid (type `npcs`), threading `isPlayer`/the slain-toggle click
   * handlers/the `NpcFilters` props through `ListPage`'s `context`/`filtersProps`.
   *
   * @param {object} state - Page state.
   * @param {string} state.gameSlug - Current game slug.
   * @param {string} state.basePath - Base hash path for the NPCs list.
   * @param {string} state.backHref - Hash path to the parent game page.
   * @param {string} state.newHref - Hash path to the new NPC form.
   * @param {boolean} state.canEdit - Whether the current user may create/manage NPCs.
   * @param {boolean} state.isPlayer - Whether the current user is a player of the game.
   * @param {number} state.refreshToken - Opaque value bumped to re-trigger the list fetch.
   * @param {object} state.activeFilters - Active filter query params preserved on pagination links.
   * @param {object} handlers - Page event handlers.
   * @param {Function} handlers.onCanEditChange - Called with the list's resolved edit permission.
   * @param {Function} handlers.onUploadClick - Called with an NPC when its upload button is clicked.
   * @param {Function} handlers.onSlainClick - Called with an NPC when its real slain/revive button is clicked.
   * @param {Function} handlers.onPublicSlainClick - Called with an NPC when its public slain/revive
   *   button is clicked.
   * @param {Function} handlers.onPlayerSlainClick - Called with an NPC when its player-facing
   *   slain/revive button is clicked.
   * @param {Function} handlers.onFilterQuery - Called with the built filter query object.
   * @param {Function} handlers.onFilterClear - Called when the filters are cleared.
   * @returns {React.ReactElement} Rendered NPCs page.
   */
  static render(state, handlers) {
    return (
      <>
        <div className="container mt-4">
          <PageActions backHref={state.backHref}>
            <ConditionalComponent render={state.canEdit}>
              <NewButton href={state.newHref}>
                {Translator.t('game_npcs_page.new_npc')}
              </NewButton>
            </ConditionalComponent>
          </PageActions>
          <h1 className="mb-4">{Translator.t('game_npcs_page.title')}</h1>
        </div>
        <ListPage
          type="npcs"
          gameSlug={state.gameSlug}
          basePath={state.basePath}
          loadingMessage={Translator.t('game_characters_page.loading')}
          context={{
            isPlayer: state.isPlayer,
            onUploadClick: handlers.onUploadClick,
            onSlainClick: handlers.onSlainClick,
            onPublicSlainClick: handlers.onPublicSlainClick,
            onPlayerSlainClick: handlers.onPlayerSlainClick,
          }}
          filtersProps={{
            onQuery: handlers.onFilterQuery, onClear: handlers.onFilterClear, canEdit: state.canEdit,
          }}
          activeFilters={state.activeFilters}
          refreshToken={state.refreshToken}
          onCanEditChange={handlers.onCanEditChange}
        />
      </>
    );
  }
}
