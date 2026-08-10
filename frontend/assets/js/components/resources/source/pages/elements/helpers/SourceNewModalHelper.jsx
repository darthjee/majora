import Modal from 'react-bootstrap/cjs/Modal.js';
import FormField from '../../../../../common/forms/FormField.jsx';
import SubmitButton from '../../../../../common/buttons/SubmitButton.jsx';
import Translator from '../../../../../../i18n/Translator.js';
import SourcePhotoField from '../SourcePhotoField.jsx';

/**
 * Rendering helper for the "New Source" modal: a single-column form (photo, then name, then
 * url) inside `Modal.Body`, with a full-width submit button as the `Modal.Footer`, following the
 * `Modal`/`Modal.Header`/`Modal.Body`/`Modal.Footer` shell pattern already used by
 * `StlModelNewModalHelper`. Unlike `StlModelNewModalHelper`, there is no two-column split — there
 * is nothing to put in a second column (no tags field). Reuses the `source_new_page.*` i18n keys.
 */
export default class SourceNewModalHelper {
  /**
   * Render the "New Source" modal.
   *
   * @param {boolean} show - Whether the modal is visible.
   * @param {{name: string, url: string, status: string, fieldErrors: object,
   *   photoPreviewUrl: string|null}} formState - Form state. `photoPreviewUrl` is a local object
   *   URL for the picked-but-not-yet-uploaded photo, or null before a photo is picked (renders the
   *   default `default_source.png` placeholder).
   * @param {{onClose: Function, onSubmit: Function, onNameChange: Function,
   *   onUrlChange: Function, onOpenUploadModal: Function, onRetryPhotoUpload: Function,
   *   onSkipPhotoUpload: Function}} handlers - Event handlers.
   * @returns {React.ReactElement} Rendered "New Source" modal.
   */
  static render(show, formState, handlers) {
    return (
      <Modal show={show} onHide={handlers.onClose}>
        <form onSubmit={handlers.onSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>{Translator.t('source_new_page.title')}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {SourceNewModalHelper.#renderError(formState)}
            {SourceNewModalHelper.#renderPhotoUploadFailed(formState, handlers)}
            <SourcePhotoField
              url={formState.photoPreviewUrl}
              alt={formState.name}
              onClick={handlers.onOpenUploadModal}
            />
            <FormField
              id="source-new-name"
              type="text"
              label={Translator.t('source_new_page.name_label')}
              value={formState.name}
              onChange={handlers.onNameChange}
              errors={formState.fieldErrors.name ?? []}
            />
            <FormField
              id="source-new-url"
              type="text"
              label={Translator.t('source_new_page.url_label')}
              value={formState.url}
              onChange={handlers.onUrlChange}
              errors={formState.fieldErrors.url ?? []}
            />
          </Modal.Body>
          <Modal.Footer>
            <SubmitButton disabled={formState.status === 'submitting'}>
              {Translator.t('source_new_page.submit')}
            </SubmitButton>
          </Modal.Footer>
        </form>
      </Modal>
    );
  }

  static #renderError(formState) {
    if (formState.status !== 'error') {
      return null;
    }

    return <div className="alert alert-danger">{Translator.t('source_new_page.error')}</div>;
  }

  static #renderPhotoUploadFailed(formState, handlers) {
    if (formState.status !== 'photo-upload-failed') {
      return null;
    }

    return (
      <div className="alert alert-warning">
        <p>{Translator.t('source_new_page.photo_upload_failed')}</p>
        <button
          type="button"
          className="btn btn-primary me-2"
          onClick={handlers.onRetryPhotoUpload}
        >
          {Translator.t('source_new_page.retry_photo_upload')}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handlers.onSkipPhotoUpload}
        >
          {Translator.t('source_new_page.skip_photo_upload')}
        </button>
      </div>
    );
  }
}
