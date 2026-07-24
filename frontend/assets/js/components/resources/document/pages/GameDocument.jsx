import { useEffect, useMemo, useState } from 'react';
import DocumentDetailHelper from './helpers/DocumentDetailHelper.jsx';
import GameDocumentController from './controllers/GameDocumentController.js';
import FacadeRefresh from '../../../../utils/access/useFacadeRefresh.js';
import getCurrentHash from '../../../../utils/routing/currentHash.js';

/**
 * Game document detail page (issue #758): loads a single `GameDocument` (via
 * {@link GameDocumentController}, which picks between the public and elevated `full.json`
 * endpoint based on the requester's game-level edit permission) and delegates rendering to
 * {@link DocumentDetailHelper}. Simpler than `GameItem` — no edit button, no photo upload
 * affordance, both out of scope for this issue.
 *
 * @param {object} [props] - Component props.
 * @param {Function} [props.ControllerClass] - Document controller class to instantiate, mainly
 *   for tests.
 * @returns {React.ReactElement} Game document detail page element.
 */
export default function GameDocument({ ControllerClass = GameDocumentController }) {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const controller = useMemo(
    () => new ControllerClass(setDocument, setLoading, setError),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);
  FacadeRefresh.useFacadeRefresh(controller);

  const currentHash = getCurrentHash();
  const { game_slug: gameSlug } = GameDocumentController.getParamsFromHash(currentHash);
  const backHref = `#/games/${gameSlug}/documents`;

  if (loading) return DocumentDetailHelper.renderLoading();
  if (error) return DocumentDetailHelper.renderError(error);

  return DocumentDetailHelper.render(document, backHref);
}
