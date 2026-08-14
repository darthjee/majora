import React from 'react';
import FactionCharacterCard from '../FactionCharacterCard.jsx';
import KickConfirmModal from '../KickConfirmModal.jsx';
import Pagination from '../../../../../common/pagination/Pagination.jsx';
import ErrorAlert from '../../../../../common/misc/ErrorAlert.jsx';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Rendering helper for the faction show page's character-list panel (issue #943): a title, a
 * responsive card grid (mirroring `ListPageHelper`'s own grid shell), an empty-state message when
 * the faction has zero members, and real pagination synced to the URL hash. Also (issue #1106)
 * threads a per-row kick control to each card and renders the kick confirmation modal/error.
 */
export default class FactionCharactersPanelHelper {
  /**
   * Render the panel.
   *
   * @param {object} state - Panel state.
   * @param {object[]} state.items - Currently loaded page of faction characters.
   * @param {object} state.pagination - Pagination metadata (`page`, `pages`, `perPage`).
   * @param {boolean} state.isDmOrAdmin - Whether the current viewer is DM/admin-equivalent
   *   (issue #1106); every row is kickable regardless, since a non-DM/admin viewer only ever
   *   receives non-hidden rows to begin with.
   * @param {boolean} state.loading - Whether the current page is being fetched.
   * @param {string} state.error - Translation key for the current error, if any.
   * @param {string} gameSlug - Game slug, used to build each card's click-through href and the
   *   pagination links' base path.
   * @param {number|string} factionId - The `GameFaction`'s own id, used to build the pagination
   *   links' base path.
   * @param {object} kickState - Kick-related state (issue #1106).
   * @param {object|null} kickState.target - Faction character-list entry pending
   *   kick-confirmation, or `null` when none.
   * @param {string} [kickState.factionName] - The faction's own name, shown in the confirmation
   *   modal's message.
   * @param {boolean} kickState.submitting - Whether a kick request is currently in flight.
   * @param {string} kickState.error - Translation key for the current kick error, if any.
   * @param {object} kickHandlers - Kick event handlers.
   * @param {Function} kickHandlers.onKick - Handler invoked with a character when its card's kick
   *   button is clicked.
   * @param {Function} kickHandlers.onConfirm - Handler invoked when the kick confirmation modal's
   *   Confirm button is clicked.
   * @param {Function} kickHandlers.onCancel - Handler invoked when the kick confirmation modal is
   *   dismissed/cancelled.
   * @returns {React.ReactElement} Rendered panel.
   */
  static render(state, gameSlug, factionId, kickState, kickHandlers) {
    return (
      <div className="mt-4">
        <h5>{Translator.t('faction_page.characters_panel_title')}</h5>
        {FactionCharactersPanelHelper.#renderKickError(kickState.error)}
        {FactionCharactersPanelHelper.#renderBody(state, gameSlug, factionId, kickHandlers.onKick)}
        <KickConfirmModal
          show={kickState.target !== null}
          characterName={kickState.target?.name ?? ''}
          factionName={kickState.factionName ?? ''}
          submitting={kickState.submitting}
          onConfirm={kickHandlers.onConfirm}
          onCancel={kickHandlers.onCancel}
        />
      </div>
    );
  }

  static #renderKickError(error) {
    if (!error) {
      return null;
    }

    return <ErrorAlert error={Translator.t(error)} />;
  }

  static #renderBody(state, gameSlug, factionId, onKick) {
    if (state.loading) {
      return <p className="text-muted">{Translator.t('faction_page.loading')}</p>;
    }

    if (state.error) {
      return <ErrorAlert error={Translator.t(state.error)} />;
    }

    if (state.items.length === 0) {
      return <p className="text-muted">{Translator.t('faction_page.characters_panel_empty')}</p>;
    }

    return (
      <>
        <div className="row">
          {state.items.map((character) => (
            <FactionCharacterCard
              key={character.id}
              character={character}
              gameSlug={gameSlug}
              canKick={state.isDmOrAdmin || !character.hidden}
              onKick={onKick}
            />
          ))}
        </div>
        <Pagination
          currentPage={state.pagination.page}
          totalPages={state.pagination.pages}
          perPage={state.pagination.perPage}
          basePath={`#/games/${gameSlug}/factions/${factionId}`}
        />
      </>
    );
  }
}
