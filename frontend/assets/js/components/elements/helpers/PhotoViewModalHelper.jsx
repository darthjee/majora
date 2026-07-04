import Modal from 'react-bootstrap/cjs/Modal.js';

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
   * @returns {React.ReactElement} Photo view modal element.
   */
  static render(show, photo, alt, onClose) {
    return (
      <Modal show={show} onHide={onClose} centered size="lg">
        <Modal.Header closeButton />
        <Modal.Body className="text-center">
          {PhotoViewModalHelper.#renderPhoto(photo, alt)}
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
}
