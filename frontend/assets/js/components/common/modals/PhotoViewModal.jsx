import PhotoViewModalHelper from './helpers/PhotoViewModalHelper.jsx';

/**
 * Lightbox modal displaying a single photo at full size.
 *
 * @param {object} props - Component props.
 * @param {boolean} props.show - Whether the modal is visible.
 * @param {object|null} props.photo - Photo data object to display, or null when none is selected.
 * @param {string} [props.photo.path] - Photo storage path, used as the image src.
 * @param {string} props.alt - Alt text applied to the photo image.
 * @param {Function} props.onClose - Handler invoked when the modal is closed.
 * @param {object} [props.setProfilePhoto] - "Set as profile photo" button configuration.
 * @param {boolean} [props.setProfilePhoto.canSetProfilePhoto] - Whether to show the "set as
 *   profile photo" button.
 * @param {boolean} [props.setProfilePhoto.isProfilePhoto] - Whether the displayed photo is
 *   already the profile photo.
 * @param {Function} [props.setProfilePhoto.onSetProfilePhoto] - Handler invoked with the photo
 *   id when the "set as profile photo" button is clicked.
 * @param {object} [props.deletePhoto] - Delete-photo button configuration.
 * @param {boolean} [props.deletePhoto.canDelete] - Whether to show the delete-photo button.
 * @param {Function} [props.deletePhoto.onDelete] - Handler invoked with the photo id when the
 *   delete button is clicked.
 * @returns {React.ReactElement} Photo view modal element.
 */
export default function PhotoViewModal({
  show,
  photo,
  alt,
  onClose,
  setProfilePhoto = {},
  deletePhoto = {},
}) {
  return PhotoViewModalHelper.render(show, photo, alt, onClose, setProfilePhoto, deletePhoto);
}
