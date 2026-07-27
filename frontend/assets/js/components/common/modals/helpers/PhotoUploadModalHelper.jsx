import Modal from 'react-bootstrap/cjs/Modal.js';
import Translator from '../../../../i18n/Translator.js';

/**
 * Renders the photo upload modal shell and form elements.
 */
export default class PhotoUploadModalHelper {
  /**
   * Renders the photo (or file, issue #726) upload modal.
   *
   * @param {boolean} show - Whether the modal is visible.
   * @param {{error: boolean, uploading: boolean, deferred: boolean, translationPrefix: string,
   *   accept: string}} state - Modal state. `translationPrefix` is the i18n key prefix used for
   *   every string rendered in this modal (defaults to `photo_upload_modal`, e.g.
   *   `file_upload_modal` for the file-upload variant). `accept` is forwarded as-is to the
   *   `<input type="file">`'s `accept` attribute (e.g. `.pdf`), left unset for the default photo
   *   behavior (no restriction).
   * @param {{onClose: Function, onCancel: Function, onSubmit: Function,
   *   onFileChange: Function, onDragOver: Function, onDrop: Function}} handlers - Modal event handlers.
   * @returns {React.ReactElement} Rendered photo upload modal.
   */
  static render(show, state, handlers) {
    const { translationPrefix = 'photo_upload_modal', accept } = state;

    return (
      <Modal show={show} onHide={handlers.onClose}>
        <Modal.Header closeButton>
          <Modal.Title>{Translator.t(`${translationPrefix}.title`)}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {PhotoUploadModalHelper.#renderError(state, translationPrefix)}
          <div
            className="border border-2 p-4 text-center"
            onDragOver={handlers.onDragOver}
            onDrop={handlers.onDrop}
          />
          <input type="file" accept={accept} onChange={handlers.onFileChange} />
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary" type="button" onClick={handlers.onCancel}>
            {Translator.t(`${translationPrefix}.cancel`)}
          </button>
          <button
            className="btn btn-primary"
            type="button"
            onClick={handlers.onSubmit}
            disabled={state.uploading}
          >
            {Translator.t(`${translationPrefix}.${state.deferred ? 'confirm' : 'submit'}`)}
          </button>
        </Modal.Footer>
      </Modal>
    );
  }

  static #renderError(state, translationPrefix) {
    if (!state.error) {
      return null;
    }

    return (
      <div className="alert alert-danger">
        {Translator.t(`${translationPrefix}.error`)}
      </div>
    );
  }
}
