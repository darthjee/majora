import Modal from 'react-bootstrap/cjs/Modal.js';
import FormField from '../../../../../common/forms/FormField.jsx';
import TagsField from '../../../../../common/forms/TagsField.jsx';
import MultiResourcePickerField from '../../../../../common/forms/MultiResourcePickerField.jsx';
import SubmitButton from '../../../../../common/buttons/SubmitButton.jsx';
import Translator from '../../../../../../i18n/Translator.js';
import StlModelPhotoField from '../StlModelPhotoField.jsx';

/**
 * Rendering helper for the "New STL model" modal: a two-column form (photo + name on the left,
 * tags + source picker + collection picker on the right) inside `Modal.Body`, with a full-width
 * submit button as the `Modal.Footer`, following the `Modal`/`Modal.Header`/`Modal.Body`/
 * `Modal.Footer` shell pattern already used by `ResourceExchangeModalHelper`/`LoginModalHelper`.
 * Reuses the same `stl_model_new_page.*` i18n keys the former standalone `/stl_models/new` page
 * used.
 */
export default class StlModelNewModalHelper {
  /**
   * Render the "New STL model" modal.
   *
   * @param {boolean} show - Whether the modal is visible.
   * @param {{name: string, tags: string[], tagInput: string,
   *   sources: {id: number, name: string}[], collections: {id: number, name: string}[],
   *   status: string, fieldErrors: object, photoPreviewUrl: string|null}} formState - Form state.
   *   `photoPreviewUrl` is a local object URL for the picked-but-not-yet-uploaded photo, or null
   *   before a photo is picked (renders the default `default_stl_model.png` placeholder).
   * @param {{onClose: Function, onSubmit: Function, onNameChange: Function,
   *   onTagInputChange: Function, onAddTag: Function, onRemoveTag: Function,
   *   onSourcesChange: Function, onCollectionsChange: Function, onOpenUploadModal: Function,
   *   onRetryPhotoUpload: Function, onSkipPhotoUpload: Function}} handlers - Event handlers.
   * @returns {React.ReactElement} Rendered "New STL model" modal.
   */
  static render(show, formState, handlers) {
    return (
      <Modal show={show} onHide={handlers.onClose}>
        <form onSubmit={handlers.onSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>{Translator.t('stl_model_new_page.title')}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {StlModelNewModalHelper.#renderError(formState)}
            {StlModelNewModalHelper.#renderPhotoUploadFailed(formState, handlers)}
            <div className="row">
              <div className="col-md-6">
                <StlModelPhotoField
                  url={formState.photoPreviewUrl}
                  alt={formState.name}
                  onClick={handlers.onOpenUploadModal}
                />
                <FormField
                  id="stl-model-new-name"
                  type="text"
                  label={Translator.t('stl_model_new_page.name_label')}
                  value={formState.name}
                  onChange={handlers.onNameChange}
                  errors={formState.fieldErrors.name ?? []}
                />
              </div>
              <div className="col-md-6">
                <TagsField
                  id="stl-model-new-tags"
                  label={Translator.t('stl_model_new_page.tags_label')}
                  placeholder={Translator.t('stl_model_new_page.tags_input_placeholder')}
                  addLabel={Translator.t('stl_model_new_page.add_tag')}
                  tags={formState.tags}
                  inputValue={formState.tagInput}
                  onInputChange={handlers.onTagInputChange}
                  onAdd={handlers.onAddTag}
                  onRemoveTag={handlers.onRemoveTag}
                  removeTagLabel={Translator.t('stl_model_new_page.remove_tag_tooltip')}
                  errors={formState.fieldErrors.tags ?? []}
                />
                <MultiResourcePickerField
                  resource="source"
                  maxEntries={4}
                  value={formState.sources}
                  onChange={handlers.onSourcesChange}
                  label={Translator.t('stl_model_new_page.sources_label')}
                  searchPlaceholder={Translator.t('stl_model_new_page.sources_search_placeholder')}
                  removeLabel={Translator.t('stl_model_new_page.remove_tag_tooltip')}
                />
                <MultiResourcePickerField
                  resource="collection"
                  maxEntries={4}
                  value={formState.collections}
                  onChange={handlers.onCollectionsChange}
                  label={Translator.t('stl_model_new_page.collections_label')}
                  searchPlaceholder={Translator.t('stl_model_new_page.collections_search_placeholder')}
                  removeLabel={Translator.t('stl_model_new_page.remove_tag_tooltip')}
                />
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <SubmitButton disabled={formState.status === 'submitting'}>
              {Translator.t('stl_model_new_page.submit')}
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

    return <div className="alert alert-danger">{Translator.t('stl_model_new_page.error')}</div>;
  }

  static #renderPhotoUploadFailed(formState, handlers) {
    if (formState.status !== 'photo-upload-failed') {
      return null;
    }

    return (
      <div className="alert alert-warning">
        <p>{Translator.t('stl_model_new_page.photo_upload_failed')}</p>
        <button
          type="button"
          className="btn btn-primary me-2"
          onClick={handlers.onRetryPhotoUpload}
        >
          {Translator.t('stl_model_new_page.retry_photo_upload')}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handlers.onSkipPhotoUpload}
        >
          {Translator.t('stl_model_new_page.skip_photo_upload')}
        </button>
      </div>
    );
  }
}
