import Modal from 'react-bootstrap/cjs/Modal.js';
import Translator from '../../../../i18n/Translator.js';

/**
 * Renders the profile photo set confirmation modal shell.
 */
export default class ProfilePhotoSetModalHelper {
  /**
   * Renders the profile photo set confirmation modal, showing the given photo and a
   * single Close button.
   *
   * @param {boolean} show - Whether the modal is visible.
   * @param {object|null} photo - Photo data object to display, or null when none is selected.
   * @param {string} [photo.path] - Photo storage path, used as the image src.
   * @param {string} alt - Alt text applied to the photo image.
   * @param {Function} onClose - Handler invoked when the modal is closed.
   * @returns {React.ReactElement} Rendered profile photo set confirmation modal.
   */
  static render(show, photo, alt, onClose) {
    return (
      <Modal show={show} onHide={onClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>{Translator.t('profile_photo_set_modal.title')}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {ProfilePhotoSetModalHelper.#renderPhoto(photo, alt)}
          <p className="mt-3">{Translator.t('profile_photo_set_modal.body')}</p>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary" type="button" onClick={onClose}>
            {Translator.t('profile_photo_set_modal.close')}
          </button>
        </Modal.Footer>
      </Modal>
    );
  }

  /**
   * Render the photo image, when a photo is selected.
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
}
