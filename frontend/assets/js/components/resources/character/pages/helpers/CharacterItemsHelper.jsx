import React from 'react';
import PageActions from '../../../../common/list_page/PageActions.jsx';
import NewButton from '../../../../common/buttons/NewButton.jsx';
import ListPage from '../../../../common/list_page/ListPage.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper shared by the PcCharacterItems and NpcCharacterItems pages, mirroring
 * `GameCharactersHelper`'s per-kind sharing but for the `ListPage`-backed item list (issue #658).
 */
export default class CharacterItemsHelper {
  /**
   * Render the items page: header (back button, "Create Item" action, heading) and the shared
   * `ListPage` grid (type `pc-items`/`npc-items`). No upload modal.
   *
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`), used as the URL segment.
   * @param {string} listType - `listTypeConfig` key for this character kind (`'pc-items'`/`'npc-items'`).
   * @param {string} gameSlug - Game slug the character belongs to.
   * @param {string|number} characterId - Character id.
   * @param {boolean} [canCreateItem] - Whether the current user may create items for this
   *   character (issue #714), gating the "Create Item" button.
   * @returns {React.ReactElement} Rendered items page.
   */
  static render(characterKind, listType, gameSlug, characterId, canCreateItem = false) {
    const basePath = `#/games/${gameSlug}/${characterKind}/${characterId}/items`;
    const backHref = `#/games/${gameSlug}/${characterKind}/${characterId}`;
    const newHref = `${basePath}/new`;

    return (
      <>
        <div className="container mt-4">
          <PageActions backHref={backHref}>
            {CharacterItemsHelper.#renderNewButton(canCreateItem, newHref)}
          </PageActions>
          <h1 className="mb-4">{Translator.t('character_items_page.title')}</h1>
        </div>
        <ListPage
          type={listType}
          gameSlug={gameSlug}
          basePath={basePath}
          loadingMessage={Translator.t('character_items_page.loading')}
          context={{ characterId }}
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
}
