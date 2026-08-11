import Modal from 'react-bootstrap/cjs/Modal.js';
import FormField from '../../../../../common/forms/FormField.jsx';
import SingleResourcePickerField from '../../../../../common/forms/SingleResourcePickerField.jsx';
import SubmitButton from '../../../../../common/buttons/SubmitButton.jsx';
import Translator from '../../../../../../i18n/Translator.js';
import CollectionPhotoField from '../CollectionPhotoField.jsx';

/**
 * Rendering helper for the "New Collection" modal: a single-column form (photo, then name, url,
 * then an optional source picker) inside `Modal.Body`, with a full-width submit button as the
 * `Modal.Footer`, mirroring `SourceNewModalHelper`'s shell pattern. `Collection.source` starts
 * `null` on create; picking one through the `SingleResourcePickerField` sets it on submit.
 * Reuses the `collection_new_page.*` i18n keys.
 */
export default class CollectionNewModalHelper {
  /**
   * Render the "New Collection" modal.
   *
   * @param {boolean} show - Whether the modal is visible.
   * @param {{name: string, url: string, source: ({id: number, name: string}|null),
   *   status: string, fieldErrors: object, photoPreviewUrl: string|null}} formState - Form state.
   *   `photoPreviewUrl` is a local object URL for the picked-but-not-yet-uploaded photo, or null
   *   before a photo is picked (renders the default `default_collection.png` placeholder).
   * @param {{onClose: Function, onSubmit: Function, onNameChange: Function,
   *   onUrlChange: Function, onSourceChange: Function, onOpenUploadModal: Function,
   *   onRetryPhotoUpload: Function, onSkipPhotoUpload: Function}} handlers - Event handlers.
   * @returns {React.ReactElement} Rendered "New Collection" modal.
   */
  static render(show, formState, handlers) {
    return (
      <Modal show={show} onHide={handlers.onClose}>
        <form onSubmit={handlers.onSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>{Translator.t('collection_new_page.title')}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {CollectionNewModalHelper.#renderError(formState)}
            {CollectionNewModalHelper.#renderPhotoUploadFailed(formState, handlers)}
            <CollectionPhotoField
              url={formState.photoPreviewUrl}
              alt={formState.name}
              onClick={handlers.onOpenUploadModal}
            />
            <FormField
              id="collection-new-name"
              type="text"
              label={Translator.t('collection_new_page.name_label')}
              value={formState.name}
              onChange={handlers.onNameChange}
              errors={formState.fieldErrors.name ?? []}
            />
            <FormField
              id="collection-new-url"
              type="text"
              label={Translator.t('collection_new_page.url_label')}
              value={formState.url}
              onChange={handlers.onUrlChange}
              errors={formState.fieldErrors.url ?? []}
            />
            <SingleResourcePickerField
              resource="source"
              maxEntries={4}
              value={formState.source}
              onChange={handlers.onSourceChange}
              label={Translator.t('collection_new_page.source_label')}
              searchPlaceholder={Translator.t('collection_new_page.source_search_placeholder')}
            />
          </Modal.Body>
          <Modal.Footer>
            <SubmitButton disabled={formState.status === 'submitting'}>
              {Translator.t('collection_new_page.submit')}
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

    return <div className="alert alert-danger">{Translator.t('collection_new_page.error')}</div>;
  }

  static #renderPhotoUploadFailed(formState, handlers) {
    if (formState.status !== 'photo-upload-failed') {
      return null;
    }

    return (
      <div className="alert alert-warning">
        <p>{Translator.t('collection_new_page.photo_upload_failed')}</p>
        <button
          type="button"
          className="btn btn-primary me-2"
          onClick={handlers.onRetryPhotoUpload}
        >
          {Translator.t('collection_new_page.retry_photo_upload')}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handlers.onSkipPhotoUpload}
        >
          {Translator.t('collection_new_page.skip_photo_upload')}
        </button>
      </div>
    );
  }
}
