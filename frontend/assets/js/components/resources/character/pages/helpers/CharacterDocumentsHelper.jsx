import React from 'react';
import PageActions from '../../../../common/list_page/PageActions.jsx';
import ListPage from '../../../../common/list_page/ListPage.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper shared by the PcCharacterDocuments and NpcCharacterDocuments pages,
 * mirroring `CharacterItemsHelper`'s per-kind sharing but for the `ListPage`-backed document
 * list (issue #725). No "New"/"Add" action or upload modal, no detail page to link to.
 */
export default class CharacterDocumentsHelper {
  /**
   * Render the documents page: header (back button, heading) and the shared `ListPage` grid
   * (type `pc-documents`/`npc-documents`).
   *
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`), used as the URL segment.
   * @param {string} listType - `listTypeConfig` key for this character kind
   *   (`'pc-documents'`/`'npc-documents'`).
   * @param {string} gameSlug - Game slug the character belongs to.
   * @param {string|number} characterId - Character id.
   * @returns {React.ReactElement} Rendered documents page.
   */
  static render(characterKind, listType, gameSlug, characterId) {
    const basePath = `#/games/${gameSlug}/${characterKind}/${characterId}/documents`;
    const backHref = `#/games/${gameSlug}/${characterKind}/${characterId}`;

    return (
      <>
        <div className="container mt-4">
          <PageActions backHref={backHref} />
          <h1 className="mb-4">{Translator.t('character_documents_page.title')}</h1>
        </div>
        <ListPage
          type={listType}
          gameSlug={gameSlug}
          basePath={basePath}
          loadingMessage={Translator.t('character_documents_page.loading')}
          context={{ characterId }}
        />
      </>
    );
  }
}
