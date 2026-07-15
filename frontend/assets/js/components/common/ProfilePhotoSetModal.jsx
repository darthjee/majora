import ProfilePhotoSetModalHelper from './helpers/ProfilePhotoSetModalHelper.jsx';

/**
 * Confirmation modal shown after a photo has been successfully set as the
 * character's profile photo.
 *
 * @param {object} props - Component props.
 * @param {boolean} props.show - Whether the modal is visible.
 * @param {object|null} props.photo - Photo data object to display, or null when none is selected.
 * @param {string} [props.photo.path] - Photo storage path, used as the image src.
 * @param {string} props.alt - Alt text applied to the photo image.
 * @param {Function} props.onClose - Handler invoked when the modal is closed.
 * @returns {React.ReactElement} Profile photo set confirmation modal element.
 */
export default function ProfilePhotoSetModal({ show, photo, alt, onClose }) {
  return ProfilePhotoSetModalHelper.render(show, photo, alt, onClose);
}
