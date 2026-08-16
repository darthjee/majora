import React from 'react';
import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import ShowPageLayout from '../../../../common/show_page/ShowPageLayout.jsx';
import Translator from '../../../../../i18n/Translator.js';
import Noop from '../../../../../utils/Noop.js';

/**
 * Rendering helper for the PC/NPC document detail page (issue #892, description and file/photo
 * shortlists added in #897), shared by `PcCharacterDocument` and `NpcCharacterDocument` (via the
 * shared `CharacterDocument` page component), mirroring `ItemDetailHelper`'s shape but simpler: no
 * photo upload, no Edit button — `CharacterDocument` has nothing left to edit once its
 * `name`/`description`/`photo` overrides were removed, and no edit route exists for it. Renders
 * through the dedicated `character_document` `showTypeConfig` entry
 * (`characterDocumentShowType.js`), not the unrelated `document` entry backing the `GameDocument`
 * show/new/edit page — though, since #897, that entry now mirrors `documentShowType`'s own
 * description/file/photo shortlist layout (minus photo upload and edit/new modes, which
 * `CharacterDocument` still has none of).
 */
export default class CharacterDocumentDetailHelper {
  /**
   * Render the document detail view through `ShowPageLayout`: a back button, then the document's
   * photo/name in the left column, its description in the right column, and its files/photos
   * shortlists below — all delegated from the underlying `GameDocument` (issue #897).
   *
   * @param {object} document - `CharacterDocument` data object.
   * @param {string} document.name - Document name.
   * @param {string} [document.description] - Document description, delegated from the underlying
   *   `GameDocument`.
   * @param {string|null} [document.photo_path] - Document photo URL, or null/undefined to fall
   *   back to the default document placeholder image.
   * @param {boolean} [document.hidden] - Whether the document is hidden from players (DM/admin-
   *   facing data only, present only in the `/full.json` variant).
   * @param {string} backHref - Hash path to the document's parent list page.
   * @param {string} gameSlug - Game slug the character belongs to, merged into the rendering
   *   context as `game_slug` — needed by the bottom file/photo shortlist slots to fetch against.
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`), merged into the
   *   rendering context as `kind`.
   * @param {number|string} characterId - Character id, merged into the rendering context as
   *   `character_id`.
   * @param {Function} [onSelectPhoto] - Handler invoked with a photo when a photo shortlist card
   *   is clicked, merged into `context.handlers` (issue #897). Defaults to a no-op.
   * @param {boolean} [canEditPages] - Whether the current user may edit the underlying
   *   `GameDocument`'s pages (issue #1129), threaded through to `CharacterDocumentPagesBox` (and,
   *   from there, to the resource-agnostic `DocumentPagesBox`) — this page's "Edit GameDocumentPages"
   *   entry point always redirects to the underlying `GameDocument`'s own edit page. Defaults to
   *   `false`.
   * @returns {React.ReactElement} Document detail element.
   */
  static render(
    document, backHref, gameSlug, characterKind, characterId, onSelectPhoto = Noop.noop, canEditPages = false,
  ) {
    return (
      <ShowPageLayout
        type="character_document"
        mode="show"
        backHref={backHref}
        context={{
          ...document,
          game_slug: gameSlug,
          kind: characterKind,
          character_id: characterId,
          canEditPages,
          handlers: { onSelectPhoto },
        }}
      />
    );
  }

  /**
   * Render the loading state.
   *
   * @returns {React.ReactElement} Loading message.
   */
  static renderLoading() {
    return <LoadingMessage message={Translator.t('character_document_page.loading')} />;
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
