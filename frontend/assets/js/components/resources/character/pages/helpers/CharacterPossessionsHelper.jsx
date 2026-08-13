import React from 'react';
import PageActions from '../../../../common/list_page/PageActions.jsx';
import NewButton from '../../../../common/buttons/NewButton.jsx';
import UploadButton from '../../../../common/buttons/UploadButton.jsx';
import ListPage from '../../../../common/list_page/ListPage.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper shared by the PcCharacterPossessions and NpcCharacterPossessions pages
 * (issue #1076), mirroring `CharacterItemsHelper`'s per-kind sharing for the `ListPage`-backed
 * possession list.
 */
export default class CharacterPossessionsHelper {
  /**
   * Render the possessions page: header (back button, "Create Possession" action, "Exchange
   * Possessions" action, heading) and the shared `ListPage` grid (type
   * `pc-possessions`/`npc-possessions`).
   *
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`), used as the URL segment.
   * @param {string} listType - `listTypeConfig` key for this character kind
   *   (`'pc-possessions'`/`'npc-possessions'`).
   * @param {string} gameSlug - Game slug the character belongs to.
   * @param {string|number} characterId - Character id.
   * @param {boolean} [canCreatePossession] - Whether the current user may create possessions for
   *   this character — also gates the "Exchange Possessions" button, since it is exactly the same
   *   permission the acquire/remove endpoints enforce.
   * @param {number} [refreshToken] - Opaque value bumped to re-trigger the list fetch after a
   *   successful exchange.
   * @param {Function} [onExchangePossessions] - Handler invoked when the "Exchange Possessions"
   *   button is clicked, opening the possession exchange modal.
   * @returns {React.ReactElement} Rendered possessions page.
   */
  static render(
    characterKind, listType, gameSlug, characterId, canCreatePossession = false, refreshToken = 0,
    onExchangePossessions = null,
  ) {
    const basePath = `#/games/${gameSlug}/${characterKind}/${characterId}/possessions`;
    const backHref = `#/games/${gameSlug}/${characterKind}/${characterId}`;
    const newHref = `${basePath}/new`;

    return (
      <>
        <div className="container mt-4">
          <PageActions backHref={backHref}>
            {CharacterPossessionsHelper.#renderNewButton(canCreatePossession, newHref)}
            {CharacterPossessionsHelper.#renderExchangeButton(canCreatePossession, onExchangePossessions)}
          </PageActions>
          <h1 className="mb-4">{Translator.t('character_possessions_page.title')}</h1>
        </div>
        <ListPage
          type={listType}
          gameSlug={gameSlug}
          basePath={basePath}
          loadingMessage={Translator.t('character_possessions_page.loading')}
          context={{ characterId }}
          refreshToken={refreshToken}
        />
      </>
    );
  }

  static #renderNewButton(canCreatePossession, newHref) {
    if (!canCreatePossession) {
      return null;
    }

    return (
      <NewButton href={newHref}>
        {Translator.t('character_possessions_page.new_possession')}
      </NewButton>
    );
  }

  static #renderExchangeButton(canCreatePossession, onExchangePossessions) {
    if (!canCreatePossession || !onExchangePossessions) {
      return null;
    }

    return (
      <UploadButton onClick={onExchangePossessions}>
        {Translator.t('character_possessions_page.exchange_possessions')}
      </UploadButton>
    );
  }
}
