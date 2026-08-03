import React from 'react';
import PageActions from '../../../../common/list_page/PageActions.jsx';
import UploadButton from '../../../../common/buttons/UploadButton.jsx';
import ListPage from '../../../../common/list_page/ListPage.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper shared by the PcCharacterDocuments and NpcCharacterDocuments pages,
 * mirroring `CharacterItemsHelper`'s per-kind sharing but for the `ListPage`-backed document
 * list (issue #725). No "New"/"Add" action or upload modal, no detail page to link to — but, as
 * of issue #920, an optional "Exchange" trigger opening the document exchange modal.
 */
export default class CharacterDocumentsHelper {
  /**
   * Render the documents page: header (back button, optional "Exchange" action, heading) and the
   * shared `ListPage` grid (type `pc-documents`/`npc-documents`).
   *
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`), used as the URL segment.
   * @param {string} listType - `listTypeConfig` key for this character kind
   *   (`'pc-documents'`/`'npc-documents'`).
   * @param {string} gameSlug - Game slug the character belongs to.
   * @param {string|number} characterId - Character id.
   * @param {number} [refreshToken] - Opaque value bumped to re-trigger the list fetch after a
   *   successful exchange.
   * @param {Function} [onExchangeDocuments] - Handler invoked when the "Exchange" button is
   *   clicked, opening the document exchange modal (issue #920). No button renders when omitted.
   * @returns {React.ReactElement} Rendered documents page.
   */
  static render(characterKind, listType, gameSlug, characterId, refreshToken = 0, onExchangeDocuments = null) {
    const basePath = `#/games/${gameSlug}/${characterKind}/${characterId}/documents`;
    const backHref = `#/games/${gameSlug}/${characterKind}/${characterId}`;

    return (
      <>
        <div className="container mt-4">
          <PageActions backHref={backHref}>
            {CharacterDocumentsHelper.#renderExchangeButton(onExchangeDocuments)}
          </PageActions>
          <h1 className="mb-4">{Translator.t('character_documents_page.title')}</h1>
        </div>
        <ListPage
          type={listType}
          gameSlug={gameSlug}
          basePath={basePath}
          loadingMessage={Translator.t('character_documents_page.loading')}
          context={{ characterId }}
          refreshToken={refreshToken}
        />
      </>
    );
  }

  static #renderExchangeButton(onExchangeDocuments) {
    if (!onExchangeDocuments) {
      return null;
    }

    return (
      <UploadButton onClick={onExchangeDocuments}>
        {Translator.t('document_exchange_modal.title')}
      </UploadButton>
    );
  }
}
