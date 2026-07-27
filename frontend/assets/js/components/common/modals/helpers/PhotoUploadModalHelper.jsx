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
   * @param {{error: boolean|string, uploading: boolean, deferred: boolean,
   *   translationPrefix: string, accept: string, showNameField: boolean, name: string,
   *   showPhotoField: boolean}} state - Modal state. `translationPrefix` is the i18n key prefix
   *   used for every string rendered in this modal (defaults to `photo_upload_modal`, e.g.
   *   `file_upload_modal` for the file-upload variant). `accept` is forwarded as-is to the
   *   `<input type="file">`'s `accept` attribute (e.g. `.pdf`), left unset for the default photo
   *   behavior (no restriction). `showNameField` (issue #874) toggles an optional name text
   *   input, and `name` is its current value. `showPhotoField` (issue #878) toggles an optional
   *   second file input for an image. `error` is `true`/`false` for the main upload step, or the
   *   string `'photo'` when the chained photo-upload step failed instead (renders a distinct
   *   `${translationPrefix}.photo_error` message).
   * @param {{onClose: Function, onCancel: Function, onSubmit: Function, onFileChange: Function,
   *   onNameChange: Function, onPhotoFileChange: Function, onDragOver: Function,
   *   onDrop: Function}} handlers - Modal event handlers.
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
          {PhotoUploadModalHelper.#renderNameField(state, handlers)}
          <div
            className="border border-2 p-4 text-center"
            onDragOver={handlers.onDragOver}
            onDrop={handlers.onDrop}
          />
          <input type="file" accept={accept} onChange={handlers.onFileChange} />
          {PhotoUploadModalHelper.#renderPhotoField(state, handlers)}
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

    const errorKey = state.error === 'photo' ? 'photo_error' : 'error';

    return (
      <div className="alert alert-danger">
        {Translator.t(`${translationPrefix}.${errorKey}`)}
      </div>
    );
  }

  /**
   * Renders the optional name text input (issue #874), when `state.showNameField` is true.
   *
   * @param {{showNameField: boolean, name: string, translationPrefix: string}} state - Modal state.
   * @param {{onNameChange: Function}} handlers - Modal event handlers.
   * @returns {React.ReactElement|null} The name input, or `null` when not shown.
   */
  static #renderNameField(state, handlers) {
    if (!state.showNameField) {
      return null;
    }

    const { translationPrefix = 'photo_upload_modal', name } = state;
    const label = Translator.t(`${translationPrefix}.name_label`);

    return (
      <input
        type="text"
        aria-label={label}
        placeholder={label}
        value={name}
        onChange={handlers.onNameChange}
      />
    );
  }

  /**
   * Renders the optional image file input (issue #878), when `state.showPhotoField` is true.
   *
   * @param {{showPhotoField: boolean, translationPrefix: string}} state - Modal state.
   * @param {{onPhotoFileChange: Function}} handlers - Modal event handlers.
   * @returns {React.ReactElement|null} The photo file input, or `null` when not shown.
   */
  static #renderPhotoField(state, handlers) {
    if (!state.showPhotoField) {
      return null;
    }

    const { translationPrefix = 'photo_upload_modal' } = state;
    const label = Translator.t(`${translationPrefix}.photo_label`);

    return (
      <input
        type="file"
        accept="image/*"
        aria-label={label}
        onChange={handlers.onPhotoFileChange}
      />
    );
  }
}
