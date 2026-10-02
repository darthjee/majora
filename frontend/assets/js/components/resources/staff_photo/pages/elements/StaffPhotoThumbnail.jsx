import { useState } from 'react';
import staffPhotoThumbnailSrc from '../helpers/StaffPhotoThumbnailSrc.js';
import StaffPhotoThumbnailHelper from './helpers/StaffPhotoThumbnailHelper.jsx';

/**
 * Thumbnail of a staff photo row, with a broken-image fallback.
 *
 * @description Remembers which `src` failed to load, so the placeholder is shown for that src
 *   only (a new cache-busting version after a replace retries the image) and a failing image
 *   can never re-trigger `onError` in a loop (the placeholder is not an image).
 * @param {object} props - Component props.
 * @param {{id: number, path: string}} props.photo - The photo row.
 * @param {object} [props.versions] - Map of photo id to cache-busting version.
 * @returns {React.ReactElement} Thumbnail element.
 */
export default function StaffPhotoThumbnail({ photo, versions = {} }) {
  const [brokenSrc, setBrokenSrc] = useState(null);
  const src = photo.path ? staffPhotoThumbnailSrc(photo, versions) : null;

  return StaffPhotoThumbnailHelper.render(src, brokenSrc === src, () => setBrokenSrc(src));
}
