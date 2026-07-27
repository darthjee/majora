import { useEffect, useMemo, useState } from 'react';
import GameDocumentFilesController from './controllers/GameDocumentFilesController.js';
import GameDocumentFilesHelper from './helpers/GameDocumentFilesHelper.jsx';
import getCurrentHash from '../../../../utils/routing/currentHash.js';

/**
 * Game document files index page (issue #873): a bespoke, paginated file grid for a single
 * `GameDocument`'s own `GameDocumentFile`s, everyone-accessible, mirroring
 * `GameDocumentPhotos.jsx` but rendering `DocumentFileCard`s (which download the file on click)
 * instead of opening a lightbox.
 *
 * @param {object} [props] - Component props.
 * @param {Function} [props.ControllerClass] - Files controller class to instantiate, mainly
 *   for tests.
 * @returns {React.ReactElement} Game document files page element.
 */
export default function GameDocumentFiles({ ControllerClass = GameDocumentFilesController }) {
  const [files, setFiles] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, perPage: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const controller = useMemo(
    () => new ControllerClass(setFiles, setPagination, setLoading, setError),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  const { game_slug: gameSlug, id } = GameDocumentFilesController.getParamsFromHash(getCurrentHash());
  const basePath = `#/games/${gameSlug}/documents/${id}/files`;
  const backHref = `#/games/${gameSlug}/documents/${id}`;

  if (loading) return GameDocumentFilesHelper.renderLoading();
  if (error) return GameDocumentFilesHelper.renderError(error);

  return GameDocumentFilesHelper.render(files, pagination, basePath, backHref);
}
