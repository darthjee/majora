import React from 'react';
import PageActions from '../../../../common/list_page/PageActions.jsx';
import NewButton from '../../../../common/buttons/NewButton.jsx';
import UploadButton from '../../../../common/buttons/UploadButton.jsx';
import ListPage from '../../../../common/list_page/ListPage.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper shared by the PcCharacterItems and NpcCharacterItems pages, mirroring
 * `GameCharactersHelper`'s per-kind sharing but for the `ListPage`-backed item list (issue #658).
 */
export default class CharacterItemsHelper {
  /**
   * Render the items page: header (back button, "Create Item" action, "Exchange Items" action
   * (issue #773), heading) and the shared `ListPage` grid (type `pc-items`/`npc-items`).
   *
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`), used as the URL segment.
   * @param {string} listType - `listTypeConfig` key for this character kind (`'pc-items'`/`'npc-items'`).
   * @param {string} gameSlug - Game slug the character belongs to.
   * @param {string|number} characterId - Character id.
   * @param {boolean} [canCreateItem] - Whether the current user may create items for this
   *   character (issue #714) — also gates the "Exchange Items" button (issue #773), since it is
   *   exactly the same permission the acquire/remove endpoints enforce.
   * @param {number} [refreshToken] - Opaque value bumped to re-trigger the list fetch after a
   *   successful exchange.
   * @param {Function} [onExchangeItems] - Handler invoked when the "Exchange Items" button is
   *   clicked, opening the item exchange modal.
   * @returns {React.ReactElement} Rendered items page.
   */
  static render(
    characterKind, listType, gameSlug, characterId, canCreateItem = false, refreshToken = 0,
    onExchangeItems = null,
  ) {
    const basePath = `#/games/${gameSlug}/${characterKind}/${characterId}/items`;
    const backHref = `#/games/${gameSlug}/${characterKind}/${characterId}`;
    const newHref = `${basePath}/new`;

    return (
      <>
        <div className="container mt-4">
          <PageActions backHref={backHref}>
            {CharacterItemsHelper.#renderNewButton(canCreateItem, newHref)}
            {CharacterItemsHelper.#renderExchangeButton(canCreateItem, onExchangeItems)}
          </PageActions>
          <h1 className="mb-4">{Translator.t('character_items_page.title')}</h1>
        </div>
        <ListPage
          type={listType}
          gameSlug={gameSlug}
          basePath={basePath}
          loadingMessage={Translator.t('character_items_page.loading')}
          context={{ characterId }}
          refreshToken={refreshToken}
        />
      </>
    );
  }

  static #renderNewButton(canCreateItem, newHref) {
    if (!canCreateItem) {
      return null;
    }

    return (
      <NewButton href={newHref}>
        {Translator.t('character_items_page.new_item')}
      </NewButton>
    );
  }

  static #renderExchangeButton(canCreateItem, onExchangeItems) {
    if (!canCreateItem || !onExchangeItems) {
      return null;
    }

    return (
      <UploadButton onClick={onExchangeItems}>
        {Translator.t('character_items_page.exchange_items')}
      </UploadButton>
    );
  }
}
