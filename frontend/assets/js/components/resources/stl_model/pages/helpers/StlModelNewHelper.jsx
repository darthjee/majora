import React from 'react';
import BackButton from '../../../../common/buttons/BackButton.jsx';
import FormField from '../../../../common/forms/FormField.jsx';
import TagsField from '../../../../common/forms/TagsField.jsx';
import MultiResourcePickerField from '../../../../common/forms/MultiResourcePickerField.jsx';
import SwitchField from '../../../../common/forms/SwitchField.jsx';
import SubmitButton from '../../../../common/buttons/SubmitButton.jsx';
import Translator from '../../../../../i18n/Translator.js';
import StlModelPhotoField from '../elements/StlModelPhotoField.jsx';
import StlModelHelper from './StlModelHelper.jsx';
import StlModelFormFieldsHelper from './StlModelFormFieldsHelper.jsx';

/**
 * Rendering helper for the "New STL model" page: a two-column form (photo, name, owned switch,
 * and type/races/roles/url/size fields on the left, tags + source picker + collection picker on
 * the right), following the plain `container` page shell (issue #1069 restored this page from
 * the `StlModelNewModal.jsx` modal it used to be), with the field pieces themselves reused
 * verbatim from the former modal helper (and, for `type`/`races`/`roles`/`url`/`size`, shared
 * with `StlModelEditHelper.jsx` via `StlModelFormFieldsHelper.jsx`).
 */
export default class StlModelNewHelper {
  /**
   * Render the "New STL model" page.
   *
   * @param {{name: string, tags: string[], tagInput: string, owned: boolean, type: string,
   *   races: {id: string, name: string}[], roles: {id: string, name: string}[], url: string,
   *   size: string, sources: {id: number, name: string}[],
   *   collections: {id: number, name: string}[], status: string, fieldErrors: object,
   *   photoPreviewUrl: string|null}} formState - Form state. `photoPreviewUrl` is a local object
   *   URL for the picked-but-not-yet-uploaded photo, or null before a photo is picked (renders
   *   the default `default_stl_model.png` placeholder). `size` is `''` for "no selection"
   *   (converted to `null` at the controller's request-body boundary).
   * @param {{onSubmit: Function, onNameChange: Function, onOwnedChange: Function,
   *   onTypeChange: Function, onRacesChange: Function, onRolesChange: Function,
   *   onUrlChange: Function, onSizeChange: Function, onTagInputChange: Function,
   *   onAddTag: Function, onRemoveTag: Function, onSourcesChange: Function,
   *   onCollectionsChange: Function, onOpenUploadModal: Function, onRetryPhotoUpload: Function,
   *   onSkipPhotoUpload: Function}} handlers - Event handlers.
   * @returns {React.ReactElement} Rendered "New STL model" page.
   */
  static render(formState, handlers) {
    return (
      <div className="container mt-4">
        <BackButton href="#/miniatures/stl_models" />
        <h1 className="mt-3">{Translator.t('stl_model_new_page.title')}</h1>
        {StlModelNewHelper.#renderError(formState)}
        {StlModelNewHelper.#renderPhotoUploadFailed(formState, handlers)}
        <form onSubmit={handlers.onSubmit}>
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
              <SwitchField
                id="stl-model-new-owned"
                label={Translator.t('stl_model_new_page.owned_switch_label')}
                checked={formState.owned}
                onChange={handlers.onOwnedChange}
              />
              {StlModelFormFieldsHelper.render(formState, handlers, 'stl-model-new')}
            </div>
            <div className="col-md-6">
              <TagsField
                id="stl-model-new-tags"
                tags={formState.tags}
                inputValue={formState.tagInput}
                errors={formState.fieldErrors.tags ?? []}
                handlers={{
                  onInputChange: handlers.onTagInputChange,
                  onAdd: handlers.onAddTag,
                  onRemoveTag: handlers.onRemoveTag,
                }}
                labels={{
                  label: Translator.t('stl_model_new_page.tags_label'),
                  placeholder: Translator.t('stl_model_new_page.tags_input_placeholder'),
                  addLabel: Translator.t('stl_model_new_page.add_tag'),
                  removeTagLabel: Translator.t('stl_model_new_page.remove_tag_tooltip'),
                }}
              />
              <MultiResourcePickerField
                picker={{ resource: 'source', maxEntries: 4 }}
                value={formState.sources}
                onChange={handlers.onSourcesChange}
                label={Translator.t('stl_model_new_page.sources_label')}
                searchPlaceholder={Translator.t('stl_model_new_page.sources_search_placeholder')}
                removeLabel={Translator.t('stl_model_new_page.remove_tag_tooltip')}
              />
              <MultiResourcePickerField
                picker={{ resource: 'collection', maxEntries: 4 }}
                value={formState.collections}
                onChange={handlers.onCollectionsChange}
                label={Translator.t('stl_model_new_page.collections_label')}
                searchPlaceholder={Translator.t('stl_model_new_page.collections_search_placeholder')}
                removeLabel={Translator.t('stl_model_new_page.remove_tag_tooltip')}
              />
            </div>
          </div>
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
