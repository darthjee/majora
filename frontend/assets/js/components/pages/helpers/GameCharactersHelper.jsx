import React from 'react';
import CharacterCard from '../../elements/CharacterCard.jsx';
import ConditionalComponent from '../../elements/ConditionalComponent.jsx';
import ErrorAlert from '../../elements/ErrorAlert.jsx';
import LoadingMessage from '../../elements/LoadingMessage.jsx';
import NewButton from '../../elements/NewButton.jsx';
import PageActions from '../../elements/PageActions.jsx';
import Pagination from '../../elements/Pagination.jsx';
import Translator from '../../../i18n/Translator.js';
import Noop from '../../../utils/Noop.js';

/**
 * Rendering helper shared by the GamePcs and GameNpcs pages.
 */
export default class GameCharactersHelper {
  /**
   * Render a character grid with pagination.
   *
   * @param {object[]} characters - List of character objects.
   * @param {object} pagination - Pagination metadata.
   * @param {number} pagination.page - Current page.
   * @param {number} pagination.pages - Total pages.
   * @param {number} pagination.perPage - Items per page.
   * @param {string} basePath - Base hash path used for pagination links (e.g. "#/games/slug/pcs").
   * @param {string} gameSlug - Game slug passed to each CharacterCard for its detail link.
   * @param {string} title - Page heading (e.g. "Player Characters").
   * @param {string} characterType - Character type, either 'pc' or 'npc'.
   * @param {string} backHref - Hash path to the parent game page.
   * @param {boolean} [canEdit] - Whether the current user may create new characters, and
   *   (when characterType is 'npc') edit each individual NPC's photo/slain state.
   * @param {string} [newHref] - Hash path to the new character form.
   * @param {Function} [onUploadClick] - Called with the character object when an NPC card's
   *   upload overlay button is clicked (ignored for PCs).
   * @param {Function} [onSlainClick] - Called with the character object when an NPC card's
   *   slain/revive overlay button is clicked (ignored for PCs).
   * @param {object|URLSearchParams} [extraParams] - Additional active query params (e.g. NPC
   *   filters) preserved on every pagination link.
   * @param {React.ReactNode} [filters] - Optional filter bar rendered below the title and
   *   above the character grid (e.g. NpcFilters for GameNpcs, unused by GamePcs).
   * @returns {React.ReactElement} Characters grid with pagination.
   */
  static render(
    characters, pagination, basePath, gameSlug, title, characterType, backHref,
    canEdit = false, newHref = '', onUploadClick = Noop.noop, onSlainClick = Noop.noop,
    extraParams = {}, filters = null,
  ) {
    const isNpc = characterType === 'npc';

    return (
      <div className="container mt-4">
        <PageActions backHref={backHref}>
          <ConditionalComponent render={canEdit}>
            <NewButton href={newHref}>
              {Translator.t('game_npcs_page.new_npc')}
            </NewButton>
          </ConditionalComponent>
        </PageActions>
        <h1 className="mb-4">{title}</h1>
        {filters}
        <div className="row">
          {characters.map((character) => (
            <CharacterCard
              key={character.id}
              character={character}
              gameSlug={gameSlug}
              characterType={characterType}
              {...(isNpc ? { canEdit, onUploadClick, onSlainClick } : {})}
            />
          ))}
        </div>
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          perPage={pagination.perPage}
          basePath={basePath}
          extraParams={extraParams}
        />
      </div>
    );
  }

  /**
   * Render the loading state.
   *
   * @returns {React.ReactElement} Loading message.
   */
  static renderLoading() {
    return <LoadingMessage message={Translator.t('game_characters_page.loading')} />;
  }

  /**
   * Render the error state.
   *
   * @param {string} error - Error message.
   * @returns {React.ReactElement} Error alert.
   */
  static renderError(error) {
    return <ErrorAlert error={error} />;
  }
}
