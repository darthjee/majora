import { useEffect, useMemo, useState } from 'react';
import CharacterDocumentFilesPreviewController from './controllers/CharacterDocumentFilesPreviewController.js';
import CharacterDocumentFilesPreviewHelper from './helpers/CharacterDocumentFilesPreviewHelper.jsx';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Self-fetching bottom-slot preview section on the PC/NPC `CharacterDocument` detail page,
 * showing up to `MAX_PREVIEW_DOCUMENT_FILES` of the underlying `GameDocument`'s own
 * `GameDocumentFile`s (issue #897). Mirrors `DocumentFilesPreview`'s self-fetching pattern
 * exactly, one extra `kind`/`character_id` pair for the character scope, and no "See all" card
 * (no full-list page exists yet for a `CharacterDocument`'s files).
 *
 * @param {object} props - Component props, the page's merged `ShowPageLayout` rendering context
 *   spread in.
 * @param {string} props.game_slug - Game slug, used to fetch files.
 * @param {string} props.kind - Character kind (`'pcs'` or `'npcs'`), used to fetch files.
 * @param {number|string} props.character_id - Character id, used to fetch files.
 * @param {number|string} props.id - `CharacterDocument` id, used to fetch files.
 * @returns {React.ReactElement|null} The preview section element, or `null` while loading.
 */
export default function CharacterDocumentFilesPreview({
  game_slug: gameSlug, kind, character_id: characterId, id,
}) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const controller = useMemo(
    () => new CharacterDocumentFilesPreviewController(setFiles, setLoading),
    [],
  );

  useEffect(
    () => controller.buildEffect(gameSlug, kind, characterId, id)(),
    [controller, gameSlug, kind, characterId, id],
  );

  if (loading) {
    return null;
  }

  return CharacterDocumentFilesPreviewHelper.render(files, Translator.t('character_document_page.files_title'));
}
