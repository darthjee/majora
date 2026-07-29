import { useEffect, useMemo, useState } from 'react';
import CharacterDocumentPhotosPreviewController from './controllers/CharacterDocumentPhotosPreviewController.js';
import CharacterDocumentPhotosPreviewHelper from './helpers/CharacterDocumentPhotosPreviewHelper.jsx';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Self-fetching bottom-slot preview section on the PC/NPC `CharacterDocument` detail page,
 * showing up to `MAX_PREVIEW_DOCUMENT_PHOTOS` of the underlying `GameDocument`'s own
 * `GameDocumentPhoto`s (issue #897). Mirrors `DocumentPhotosPreview`'s self-fetching pattern
 * exactly, one extra `kind`/`character_id` pair for the character scope, and no "See all" card
 * (no full-list page exists yet for a `CharacterDocument`'s photos).
 *
 * @param {object} props - Component props, the page's merged `ShowPageLayout` rendering context
 *   spread in.
 * @param {string} props.game_slug - Game slug, used to fetch photos.
 * @param {string} props.kind - Character kind (`'pcs'` or `'npcs'`), used to fetch photos.
 * @param {number|string} props.character_id - Character id, used to fetch photos.
 * @param {number|string} props.id - `CharacterDocument` id, used to fetch photos.
 * @param {{onSelectPhoto: Function}} props.handlers - Event handlers.
 * @returns {React.ReactElement|null} The preview section element, or `null` while loading.
 */
export default function CharacterDocumentPhotosPreview({
  game_slug: gameSlug, kind, character_id: characterId, id, handlers,
}) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  const controller = useMemo(
    () => new CharacterDocumentPhotosPreviewController(setPhotos, setLoading),
    [],
  );

  useEffect(
    () => controller.buildEffect(gameSlug, kind, characterId, id)(),
    [controller, gameSlug, kind, characterId, id],
  );

  if (loading) {
    return null;
  }

  return CharacterDocumentPhotosPreviewHelper.render(
    photos, Translator.t('character_document_page.photos_title'), handlers.onSelectPhoto,
  );
}
