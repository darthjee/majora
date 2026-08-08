import React from 'react';
import FormField from '../../../../common/forms/FormField.jsx';
import TagsField from '../../../../common/forms/TagsField.jsx';
import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import SubmitButton from '../../../../common/buttons/SubmitButton.jsx';
import Translator from '../../../../../i18n/Translator.js';
import StlModelPhotoField from '../elements/StlModelPhotoField.jsx';
import StlModelHelper from './StlModelHelper.jsx';

/**
 * Rendering helper for the STL model creation page.
 */
export default class StlModelNewHelper {
  /**
   * Render the STL model creation form.
   *
   * @param {{name: string, tags: string[], tagInput: string, status: string, fieldErrors: object,
   *   photoPreviewUrl: string|null}} formState - Form state. `photoPreviewUrl` is a local object
   *   URL for the picked-but-not-yet-uploaded photo, or null before a photo is picked (renders the
   *   default `default_stl_model.png` placeholder).
   * @param {{onSubmit: Function, onNameChange: Function, onTagInputChange: Function,
   *   onAddTag: Function, onOpenUploadModal: Function, onRetryPhotoUpload: Function,
   *   onSkipPhotoUpload: Function}} handlers - Event handlers.
   * @returns {React.ReactElement} Rendered new STL model page.
   */
  static render(formState, handlers) {
    return (
      <div className="container mt-4">
        <h1>{Translator.t('stl_model_new_page.title')}</h1>
        {StlModelNewHelper.#renderError(formState)}
        {StlModelNewHelper.#renderPhotoUploadFailed(formState, handlers)}
        <form onSubmit={handlers.onSubmit}>
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
          <TagsField
            id="stl-model-new-tags"
            label={Translator.t('stl_model_new_page.tags_label')}
            placeholder={Translator.t('stl_model_new_page.tags_input_placeholder')}
            addLabel={Translator.t('stl_model_new_page.add_tag')}
            tags={formState.tags}
            inputValue={formState.tagInput}
            onInputChange={handlers.onTagInputChange}
            onAdd={handlers.onAddTag}
            errors={formState.fieldErrors.tags ?? []}
          />
          <SubmitButton disabled={formState.status === 'submitting'}>
            {Translator.t('stl_model_new_page.submit')}
          </SubmitButton>
        </form>
      </div>
    );
  }

  /**
   * Render the loading state.
   *
   * @returns {React.ReactElement} Loading message.
   */
  static renderLoading() {
    return StlModelHelper.renderLoading();
  }

  static #renderError(formState) {
    if (formState.status !== 'error') {
      return null;
    }

    return <ErrorAlert error={Translator.t('stl_model_new_page.error')} />;
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
