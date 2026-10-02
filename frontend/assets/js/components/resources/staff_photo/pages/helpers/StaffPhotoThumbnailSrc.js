/**
 * Builds the thumbnail `src` for a staff photo row.
 *
 * @description Appends a `v=<version>` cache-busting param when a version is recorded for the
 *   photo id (e.g. after a successful replace), using `&` when `path` already has a query.
 * @param {{id: number, path: string}} photo - The photo row.
 * @param {object} [versions] - Map of photo id to version timestamp.
 * @returns {string} The thumbnail src.
 */
export default function staffPhotoThumbnailSrc(photo, versions = {}) {
  const version = versions[photo.id];

  if (!version) return photo.path;

  const separator = photo.path.includes('?') ? '&' : '?';

  return `${photo.path}${separator}v=${version}`;
}
