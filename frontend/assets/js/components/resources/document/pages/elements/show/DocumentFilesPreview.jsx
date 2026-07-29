import { useEffect, useMemo, useState } from 'react';
import DocumentFilesPreviewController from './controllers/DocumentFilesPreviewController.js';
import DocumentFilesPreviewHelper from './helpers/DocumentFilesPreviewHelper.jsx';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Self-fetching bottom-slot preview section on the game document detail page, showing up to
 * `MAX_PREVIEW_DOCUMENT_FILES` of the document's own `GameDocumentFile`s, with a link to the full
 * file list page (issue #873). Mirrors `DocumentPhotosPreview`'s self-fetching pattern exactly.
 *
 * @param {object} props - Component props, the page's merged `ShowPageLayout` rendering context
 *   spread in.
 * @param {string} props.game_slug - Game slug, used to fetch files and build the "See all" href.
 * @param {number|string} props.id - `GameDocument` id, used to fetch files and build the "See
 *   all" href.
 * @returns {React.ReactElement|null} The preview section element, or `null` while loading.
 */
export default function DocumentFilesPreview({ game_slug: gameSlug, id }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const controller = useMemo(
    () => new DocumentFilesPreviewController(setFiles, setLoading),
    [],
  );

  useEffect(
    () => controller.buildEffect(gameSlug, id)(),
    [controller, gameSlug, id],
  );

  if (loading) {
    return null;
  }

  return DocumentFilesPreviewHelper.render(
    files,
    Translator.t('document_page.files_title'),
    `#/games/${gameSlug}/documents/${id}/files`,
  );
}
