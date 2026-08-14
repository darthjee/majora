import React from 'react';
import FactionCharacterCard from '../FactionCharacterCard.jsx';
import Pagination from '../../../../../common/pagination/Pagination.jsx';
import ErrorAlert from '../../../../../common/misc/ErrorAlert.jsx';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Rendering helper for the faction show page's character-list panel (issue #943): a title, a
 * responsive card grid (mirroring `ListPageHelper`'s own grid shell), an empty-state message when
 * the faction has zero members, and real pagination synced to the URL hash.
 */
export default class FactionCharactersPanelHelper {
  /**
   * Render the panel.
   *
   * @param {object} state - Panel state.
   * @param {object[]} state.items - Currently loaded page of faction characters.
   * @param {object} state.pagination - Pagination metadata (`page`, `pages`, `perPage`).
   * @param {boolean} state.loading - Whether the current page is being fetched.
   * @param {string} state.error - Translation key for the current error, if any.
   * @param {string} gameSlug - Game slug, used to build each card's click-through href and the
   *   pagination links' base path.
   * @param {number|string} factionId - The `GameFaction`'s own id, used to build the pagination
   *   links' base path.
   * @returns {React.ReactElement} Rendered panel.
   */
  static render(state, gameSlug, factionId) {
    return (
      <div className="mt-4">
        <h5>{Translator.t('faction_page.characters_panel_title')}</h5>
        {FactionCharactersPanelHelper.#renderBody(state, gameSlug, factionId)}
      </div>
    );
  }

  static #renderBody(state, gameSlug, factionId) {
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
            <FactionCharacterCard key={character.id} character={character} gameSlug={gameSlug} />
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
