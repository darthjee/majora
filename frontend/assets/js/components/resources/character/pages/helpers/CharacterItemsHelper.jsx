import React from 'react';
import PageActions from '../../../../common/PageActions.jsx';
import ListPage from '../../../../common/ListPage.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper shared by the PcCharacterItems and NpcCharacterItems pages, mirroring
 * `GameCharactersHelper`'s per-kind sharing but for the `ListPage`-backed item list (issue #658).
 */
export default class CharacterItemsHelper {
  /**
   * Render the items page: header (back button, heading) and the shared `ListPage` grid
   * (type `pc-items`/`npc-items`). Read-only: no "New"/"Add" action or upload modal.
   *
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`), used as the URL segment.
   * @param {string} listType - `listTypeConfig` key for this character kind (`'pc-items'`/`'npc-items'`).
   * @param {string} gameSlug - Game slug the character belongs to.
   * @param {string|number} characterId - Character id.
   * @returns {React.ReactElement} Rendered items page.
   */
  static render(characterKind, listType, gameSlug, characterId) {
    const basePath = `#/games/${gameSlug}/${characterKind}/${characterId}/items`;
    const backHref = `#/games/${gameSlug}/${characterKind}/${characterId}`;

    return (
      <>
        <div className="container mt-4">
          <PageActions backHref={backHref} />
          <h1 className="mb-4">{Translator.t('character_items_page.title')}</h1>
        </div>
        <ListPage
          type={listType}
          gameSlug={gameSlug}
          basePath={basePath}
          loadingMessage={Translator.t('character_items_page.loading')}
        />
      </>
    );
  }
}
