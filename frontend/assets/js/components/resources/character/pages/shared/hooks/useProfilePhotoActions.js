import { useState } from 'react';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Reusable hook bundling the "set profile photo" action's `profilePhotoSet`/`actionError`
 * state together with its handler, so the character detail and character photos pages sharing
 * this same flow don't each duplicate it. Parameterized enough to serve both: the detail page's
 * plain `photos` array and the photos page's `character.photos` array, and the detail page's
 * extra post-success refetch (via the optional `onSuccess` callback).
 *
 * @param {object} params - Hook parameters.
 * @param {Function} params.requestSetProfilePhoto - `(photoId) => Promise`, issuing the
 *   set-profile-photo request for the given photo id (already bound to the game/character ids).
 * @param {Function} params.getPhotos - Returns the currently loaded photos array, searched for
 *   the photo matching the confirmed id.
 * @param {object|null} params.selectedPhoto - Currently selected photo (photo view modal),
 *   used as a fallback when the confirmed id isn't found in `getPhotos()`.
 * @param {Function} [params.onSuccess] - Optional extra callback invoked after a successful
 *   request (e.g. to refetch the character).
 * @returns {{profilePhotoSet: object|null, setProfilePhotoSet: Function, actionError: string,
 *   setActionError: Function, handleSetProfilePhoto: Function}} `profilePhotoSet`/
 *   `setProfilePhotoSet` — the just-confirmed photo (for the confirmation modal) and its raw
 *   setter; `actionError`/`setActionError` — the translated error message on failure (or `''`)
 *   and its raw setter, exposed so callers with a sibling error-producing action (e.g. delete
 *   photo) can share the same error slot; `handleSetProfilePhoto(photoId)` — issues the request
 *   and updates the above state.
 */
export default function useProfilePhotoActions({
  requestSetProfilePhoto, getPhotos, selectedPhoto, onSuccess,
}) {
  const [profilePhotoSet, setProfilePhotoSet] = useState(null);
  const [actionError, setActionError] = useState('');

  const handleSetProfilePhoto = (photoId) => {
    setActionError('');
    const photo = getPhotos().find((p) => p.id === photoId) ?? selectedPhoto;

    return requestSetProfilePhoto(photoId)
      .then(() => {
        setProfilePhotoSet(photo);
        if (onSuccess) onSuccess();
      })
      .catch(() => setActionError(Translator.t('character_photos_page.set_profile_photo_error')));
  };

  return {
    profilePhotoSet, setProfilePhotoSet, actionError, setActionError, handleSetProfilePhoto,
  };
}
