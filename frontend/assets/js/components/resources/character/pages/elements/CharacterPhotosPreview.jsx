import CharacterPhotosPreviewHelper from './helpers/CharacterPhotosPreviewHelper.jsx';

/**
 * Preview section rendering a card grid for a limited number of a
 * character's photos, with a link to the full gallery page.
 *
 * @param {object} props - Component props.
 * @param {object[]} props.photos - List of photo objects (`id`, `path`).
 * @param {string} props.title - Section heading.
 * @param {string} props.seeAllHref - Hash href for the "See all" link.
 * @param {Function} [props.onSelectPhoto] - Handler invoked with the photo when a
 *   preview card is clicked.
 * @param {boolean} [props.canSetProfilePhoto] - Whether the current user may mark a preview
 *   photo as the character's profile photo, revealing the hover action bar button.
 * @param {number|null} [props.profilePhotoId] - Id of the character's current profile photo,
 *   or null/undefined when none is set.
 * @param {Function} [props.onSetProfilePhoto] - Handler invoked with the photo id when the
 *   "mark as profile" action bar button is clicked.
 * @returns {React.ReactElement} Character photos preview section element.
 */
export default function CharacterPhotosPreview({
  photos, title, seeAllHref, onSelectPhoto, canSetProfilePhoto, profilePhotoId, onSetProfilePhoto,
}) {
  return CharacterPhotosPreviewHelper.render(
    photos, title, seeAllHref, onSelectPhoto, canSetProfilePhoto, profilePhotoId, onSetProfilePhoto,
  );
}
