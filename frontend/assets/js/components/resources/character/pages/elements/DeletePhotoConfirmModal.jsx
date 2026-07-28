import DeletePhotoConfirmModalHelper from './helpers/DeletePhotoConfirmModalHelper.jsx';

/**
 * Confirmation modal shown before permanently deleting a photo.
 *
 * @param {{show: boolean, photo: object|null, onConfirm: Function, onCancel: Function}} props - Component props.
 * @returns {React.ReactElement} Rendered delete-photo confirmation modal.
 */
export default function DeletePhotoConfirmModal({
  show, photo, onConfirm, onCancel,
}) {
  return DeletePhotoConfirmModalHelper.render(show, photo, { onConfirm, onCancel });
}
