import { useEffect, useMemo, useState } from 'react';
import DocumentPhotosPreviewController from './controllers/DocumentPhotosPreviewController.js';
import DocumentPhotosPreviewHelper from './helpers/DocumentPhotosPreviewHelper.jsx';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Self-fetching bottom-slot preview section on the game document detail page, showing up to
 * `MAX_PREVIEW_PHOTOS` of the document's own `GameDocumentPhoto`s, with a link to the full photo
 * list page (issue #873). Mirrors `OpenPollsWidget`'s self-fetching pattern rather than
 * `CharacterPhotosPreview` (which is fed already-fetched photos through context) — a document's
 * photos need their own dedicated fetch, since `ShowPageLayout`'s merged context only carries the
 * document itself, not its photos.
 *
 * @param {object} props - Component props, the page's merged `ShowPageLayout` rendering context
 *   spread in.
 * @param {string} props.game_slug - Game slug, used to fetch photos and build the "See all" href.
 * @param {number|string} props.id - `GameDocument` id, used to fetch photos and build the "See
 *   all" href.
 * @param {{onSelectPhoto: Function}} props.handlers - Event handlers.
 * @returns {React.ReactElement|null} The preview section element, or `null` while loading.
 */
export default function DocumentPhotosPreview({ game_slug: gameSlug, id, handlers }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  const controller = useMemo(
    () => new DocumentPhotosPreviewController(setPhotos, setLoading),
    [],
  );

  useEffect(
    () => controller.buildEffect(gameSlug, id)(),
    [controller, gameSlug, id],
  );

  if (loading) {
    return null;
  }

  return DocumentPhotosPreviewHelper.render(
    photos,
    Translator.t('document_page.photos_title'),
    `#/games/${gameSlug}/documents/${id}/photos`,
    handlers.onSelectPhoto,
  );
}
