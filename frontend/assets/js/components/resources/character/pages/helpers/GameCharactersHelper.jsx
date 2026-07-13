import React from 'react';
import CharacterCard from '../../../../common/CharacterCard.jsx';
import ConditionalComponent from '../../../../common/ConditionalComponent.jsx';
import ErrorAlert from '../../../../common/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/LoadingMessage.jsx';
import NewButton from '../../../../common/NewButton.jsx';
import PageActions from '../../../../common/PageActions.jsx';
import Pagination from '../../../../common/Pagination.jsx';
import Translator from '../../../../../i18n/Translator.js';
import Noop from '../../../../../utils/Noop.js';

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
   *   real slain/revive overlay button is clicked (ignored for PCs).
   * @param {Function} [onPublicSlainClick] - Called with the character object when an NPC card's
   *   public slain/revive overlay button is clicked (ignored for PCs).
   * @param {object|URLSearchParams} [extraParams] - Additional active query params (e.g. NPC
   *   filters) preserved on every pagination link.
   * @param {React.ReactNode} [filters] - Optional filter bar rendered below the title and
   *   above the character grid (e.g. NpcFilters for GameNpcs, unused by GamePcs).
   * @param {boolean} [isPlayer] - Whether the current user is a player of the game, gating
   *   each NPC card's single player-facing slain/revive button (ignored for PCs).
   * @param {Function} [onPlayerSlainClick] - Called with the character object when an NPC
   *   card's player-facing slain/revive overlay button is clicked (ignored for PCs).
   * @returns {React.ReactElement} Characters grid with pagination.
   */
  static render(
    characters, pagination, basePath, gameSlug, title, characterType, backHref,
    canEdit = false, newHref = '', onUploadClick = Noop.noop, onSlainClick = Noop.noop,
    onPublicSlainClick = Noop.noop, extraParams = {}, filters = null,
    isPlayer = false, onPlayerSlainClick = Noop.noop,
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
              {...(isNpc
                ? {
                  canEdit, onUploadClick, onSlainClick, onPublicSlainClick, isPlayer, onPlayerSlainClick,
                }
                : {})}
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
