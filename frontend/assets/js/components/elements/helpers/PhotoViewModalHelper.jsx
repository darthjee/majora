import Modal from 'react-bootstrap/cjs/Modal.js';
import Translator from '../../../i18n/Translator.js';

/**
 * Renders the photo view (lightbox) modal shell.
 */
export default class PhotoViewModalHelper {
  /**
   * Render the photo view modal, showing the given photo at full size.
   *
   * @param {boolean} show - Whether the modal is visible.
   * @param {object|null} photo - Photo data object to display, or null when none is selected.
   * @param {string} [photo.path] - Photo storage path, used as the image src.
   * @param {string} alt - Alt text applied to the photo image.
   * @param {Function} onClose - Handler invoked when the modal is closed.
   * @param {boolean} [canSetProfilePhoto] - Whether to show the "set as profile photo" button.
   * @param {boolean} [isProfilePhoto] - Whether the displayed photo is already the profile photo.
   * @param {Function} [onSetProfilePhoto] - Handler invoked with the photo id when the
   *   "set as profile photo" button is clicked.
   * @returns {React.ReactElement} Photo view modal element.
   */
  static render(show, photo, alt, onClose, canSetProfilePhoto = false, isProfilePhoto = false, onSetProfilePhoto) {
    return (
      <Modal show={show} onHide={onClose} centered size="lg">
        <Modal.Header closeButton />
        <Modal.Body className="text-center">
          {PhotoViewModalHelper.#renderPhoto(photo, alt)}
          {PhotoViewModalHelper.#renderSetProfilePhotoButton(
            photo, canSetProfilePhoto, isProfilePhoto, onSetProfilePhoto,
          )}
        </Modal.Body>
      </Modal>
    );
  }

  /**
   * Render the full-size photo image, when a photo is selected.
   *
   * @param {object|null} photo - Photo data object to display, or null when none is selected.
   * @param {string} [photo.path] - Photo storage path, used as the image src.
   * @param {string} alt - Alt text applied to the photo image.
   * @returns {React.ReactElement|null} Photo image, or null.
   */
  static #renderPhoto(photo, alt) {
    if (!photo) return null;

    return <img src={photo.path} alt={alt} className="img-fluid" />;
  }

  /**
   * Render the "set as profile photo" button, when the current user may edit the character
   * and the displayed photo is not already the profile photo.
   *
   * @param {object|null} photo - Photo data object to display, or null when none is selected.
   * @param {boolean} canSetProfilePhoto - Whether to show the button at all.
   * @param {boolean} isProfilePhoto - Whether the displayed photo is already the profile photo.
   * @param {Function} onSetProfilePhoto - Handler invoked with the photo id on click.
   * @returns {React.ReactElement|null} Button, or null.
   */
  static #renderSetProfilePhotoButton(photo, canSetProfilePhoto, isProfilePhoto, onSetProfilePhoto) {
    if (!photo || !canSetProfilePhoto || isProfilePhoto) return null;

    return (
      <button
        type="button"
        className="btn btn-primary mt-3"
        onClick={() => onSetProfilePhoto(photo.id)}
      >
        {Translator.t('photo_view_modal.set_profile_photo')}
      </button>
    );
  }
}
