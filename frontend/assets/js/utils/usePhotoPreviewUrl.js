import { useEffect, useMemo } from 'react';

/**
 * Builds a local preview URL for the given photo `File`, revoking it (via
 * `URL.revokeObjectURL`) on unmount or whenever a new `photoFile` replaces it, so New/Edit pages
 * with a photo-upload field never leak `blob:` object URLs.
 *
 * @param {(File|null)} photoFile - Selected photo file, or `null` when none is selected.
 * @returns {(string|null)} Local preview URL for `photoFile`, or `null` when `photoFile` is
 *   `null`.
 */
export default function usePhotoPreviewUrl(photoFile) {
  const photoPreviewUrl = useMemo(
    () => (photoFile ? URL.createObjectURL(photoFile) : null),
    [photoFile],
  );

  useEffect(() => () => {
    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl);
    }
  }, [photoPreviewUrl]);

  return photoPreviewUrl;
}
