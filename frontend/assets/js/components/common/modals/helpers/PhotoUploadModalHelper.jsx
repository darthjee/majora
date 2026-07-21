import Modal from 'react-bootstrap/cjs/Modal.js';
import Translator from '../../../../i18n/Translator.js';

/**
 * Renders the photo upload modal shell and form elements.
 */
export default class PhotoUploadModalHelper {
  /**
   * Renders the photo upload modal.
   *
   * @param {boolean} show - Whether the modal is visible.
   * @param {{error: boolean, uploading: boolean, deferred: boolean}} state - Modal state.
   * @param {{onClose: Function, onCancel: Function, onSubmit: Function,
   *   onFileChange: Function, onDragOver: Function, onDrop: Function}} handlers - Modal event handlers.
   * @returns {React.ReactElement} Rendered photo upload modal.
   */
  static render(show, state, handlers) {
    return (
      <Modal show={show} onHide={handlers.onClose}>
        <Modal.Header closeButton>
          <Modal.Title>{Translator.t('photo_upload_modal.title')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {PhotoUploadModalHelper.#renderError(state)}
          <div
            className="border border-2 p-4 text-center"
            onDragOver={handlers.onDragOver}
            onDrop={handlers.onDrop}
          />
          <input type="file" onChange={handlers.onFileChange} />
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary" type="button" onClick={handlers.onCancel}>
            {Translator.t('photo_upload_modal.cancel')}
          </button>
          <button
            className="btn btn-primary"
            type="button"
            onClick={handlers.onSubmit}
            disabled={state.uploading}
          >
            {Translator.t(state.deferred ? 'photo_upload_modal.confirm' : 'photo_upload_modal.submit')}
          </button>
        </Modal.Footer>
      </Modal>
    );
  }

  static #renderError(state) {
    if (!state.error) {
      return null;
    }

    return (
      <div className="alert alert-danger">
        {Translator.t('photo_upload_modal.error')}
      </div>
    );
  }
}
