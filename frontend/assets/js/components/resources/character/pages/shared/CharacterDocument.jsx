import { useEffect, useMemo, useState } from 'react';
import CharacterDocumentDetailHelper from '../helpers/CharacterDocumentDetailHelper.jsx';
import CharacterDocumentDetailController from '../controllers/CharacterDocumentDetailController.js';
import FacadeRefresh from '../../../../../utils/access/useFacadeRefresh.js';
import getCurrentHash from '../../../../../utils/routing/currentHash.js';

/**
 * Shared PC/NPC document detail page component (issue #892): loads a single `CharacterDocument`
 * (via {@link CharacterDocumentDetailController}, which picks between the public and elevated
 * `full.json` endpoint based on the requester's character-level edit permission) and delegates
 * rendering to {@link CharacterDocumentDetailHelper}. Mirrors `CharacterItem`'s loading/error/
 * effect plumbing, but simpler — no photo upload modal, no Edit button, since `CharacterDocument`
 * has nothing left to edit and no photo of its own to upload.
 *
 * @param {object} props - Component props.
 * @param {string} props.characterKind - Character kind URL segment (`'pcs'` or `'npcs'`).
 * @param {Function} [props.ControllerClass] - Document controller class to instantiate, mainly
 *   for tests.
 * @returns {React.ReactElement} Character document detail page element.
 */
export default function CharacterDocument({ characterKind, ControllerClass = CharacterDocumentDetailController }) {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const controller = useMemo(
    () => new ControllerClass(characterKind, setDocument, setLoading, setError),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [characterKind],
  );

  useEffect(() => controller.buildEffect()(), [controller]);
  FacadeRefresh.useFacadeRefresh(controller);

  const currentHash = getCurrentHash();
  const { game_slug: gameSlug, character_id: characterId } = CharacterDocumentDetailController
    .getParamsFromHash(characterKind, currentHash);
  const backHref = `#/games/${gameSlug}/${characterKind}/${characterId}/documents`;

  if (loading) return CharacterDocumentDetailHelper.renderLoading();
  if (error) return CharacterDocumentDetailHelper.renderError(error);

  return CharacterDocumentDetailHelper.render(document, backHref);
}
