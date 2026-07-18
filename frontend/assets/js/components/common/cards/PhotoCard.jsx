import PhotoCardHelper from './helpers/PhotoCardHelper.jsx';

/**
 * Bootstrap card representing a single photo. Clicking the card invokes
 * `onClick` with the photo instead of navigating to another page.
 *
 * @param {object} props - Component props.
 * @param {object} props.photo - Photo data object.
 * @param {number} props.photo.id - Photo ID.
 * @param {string} props.photo.path - Photo storage path, used as the image src.
 * @param {string} props.alt - Alt text applied to the photo image.
 * @param {Function} props.onClick - Handler invoked with the photo when the card is clicked.
 * @param {boolean} [props.canSetProfilePhoto] - Whether the current user may mark this
 *   photo as the character's profile photo, revealing the hover action bar button.
 * @param {boolean} [props.isProfilePhoto] - Whether this photo is already the character's
 *   profile photo, hiding the action bar button when true.
 * @param {Function} [props.onSetProfilePhoto] - Handler invoked with the photo id when the
 *   "mark as profile" action bar button is clicked.
 * @returns {React.ReactElement} Photo card element.
 */
export default function PhotoCard({
  photo, alt, onClick, canSetProfilePhoto = false, isProfilePhoto = false, onSetProfilePhoto,
}) {
  return PhotoCardHelper.render(photo, alt, onClick, canSetProfilePhoto, isProfilePhoto, onSetProfilePhoto);
}
