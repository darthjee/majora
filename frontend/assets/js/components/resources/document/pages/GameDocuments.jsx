import { useEffect, useMemo, useState } from 'react';
import GameDocumentsHelper from './helpers/GameDocumentsHelper.jsx';
import GameDocumentsController from './controllers/GameDocumentsController.js';
import BasePageController from '../../../common/base/controllers/BasePageController.js';
import getCurrentHash from '../../../../utils/routing/currentHash.js';

/**
 * Game Documents index page.
 *
 * @description Resolves `can_create_document` (issue #758) through
 *   {@link GameDocumentsController}, rather than `ListPage`'s built-in `onCanEditChange`/
 *   `canEdit` — the latter reflects the plain `can_edit` permission (dm/admin only) and would
 *   wrongly hide the "Create Document" link from staff.
 * @returns {React.ReactElement} Game documents page element.
 */
export default function GameDocuments() {
  const [canCreateDocument, setCanCreateDocument] = useState(false);

  const currentHash = getCurrentHash();
  const gameSlug = BasePageController.extractParam('/games/:game_slug/documents', 'game_slug', currentHash);
  const basePath = `#/games/${gameSlug}/documents`;
  const backHref = `#/games/${gameSlug}`;
  const newHref = `#/games/${gameSlug}/documents/new`;

  const controller = useMemo(() => new GameDocumentsController(setCanCreateDocument), []);

  useEffect(() => controller.buildEffect()(), [controller]);

  return GameDocumentsHelper.render({
    gameSlug, basePath, backHref, newHref, canCreateDocument,
  });
}
