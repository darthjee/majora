import React from 'react';
import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import FormField from '../../../../common/forms/FormField.jsx';
import TextareaField from '../../../../common/forms/TextareaField.jsx';
import SubmitButton from '../../../../common/buttons/SubmitButton.jsx';
import ActionsOverlay from '../../../../common/misc/ActionsOverlay.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the item edit pages (issue #766): shared by `GameItemEdit`,
 * `PcCharacterItemEdit`, and `NpcCharacterItemEdit`, since the layout and fields (`name`,
 * `description`, `hidden`) are identical across all three. Wires the existing `dimmed`/
 * `ActionsOverlay` mechanic (already used by the Character edit pages) onto `type="item"`,
 * dimming the photo whenever the `hidden` switch is on.
 */
export default class ItemEditHelper {
  /**
   * Render the item edit form: a left column with the photo (upload action button, dimmed when
   * `hidden` is on) and the `hidden` switch, and a right column with the `name`/`description`
   * fields and the submit button.
   *
   * @param {{name: string, description: string, hidden: boolean, photo_path: (string|null),
   *   status: string, fieldErrors: object}} state - Form state.
   * @param {{onSubmit: Function, onNameChange: Function, onDescriptionChange: Function,
   *   onHiddenChange: Function, onOpenUploadModal: Function}} handlers - Event handlers.
   * @returns {React.ReactElement} Rendered item edit form.
   */
  static render(state, handlers) {
    return (
      <div className="container mt-4">
        <h1>{Translator.t('item_edit_page.title')}</h1>
        {ItemEditHelper.#renderError(state)}
        <form onSubmit={handlers.onSubmit}>
          <div className="row">
            <div className="col-md-4">
              <ActionsOverlay
                type="item"
                url={state.photo_path}
                alt={state.name}
                canEdit
                onClick={handlers.onOpenUploadModal}
                dimmed={state.hidden}
              />
              {ItemEditHelper.#renderHiddenField(state, handlers)}
            </div>
            <div className="col-md-8">
              <FormField
                id="item-edit-name"
                type="text"
                label={Translator.t('item_edit_page.name_label')}
                value={state.name}
                onChange={handlers.onNameChange}
                errors={state.fieldErrors.name ?? []}
              />
              <TextareaField
                id="item-edit-description"
                label={Translator.t('item_edit_page.description_label')}
                value={state.description}
                onChange={handlers.onDescriptionChange}
                errors={state.fieldErrors.description ?? []}
              />
              <SubmitButton disabled={state.status === 'submitting'}>
                {Translator.t('item_edit_page.submit')}
              </SubmitButton>
            </div>
          </div>
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
    return <LoadingMessage message={Translator.t('item_page.loading')} />;
  }

  /**
   * Render the error state.
   *
   * @param {string} error - Error message.
   * @returns {React.ReactElement} Error alert.
   */
  static renderError(error) {
    return <ErrorAlert error={error} />;
  }

  static #renderError(state) {
    if (state.status !== 'error') {
      return null;
    }

    return <ErrorAlert error={Translator.t('item_edit_page.error')} />;
  }

  static #renderHiddenField(state, handlers) {
    return (
      <div className="form-check form-switch mb-3">
        <input
          id="item-edit-hidden"
          type="checkbox"
          role="switch"
          className="form-check-input"
          checked={state.hidden}
          onChange={handlers.onHiddenChange}
        />
        <label htmlFor="item-edit-hidden" className="form-check-label">
          {Translator.t('item_edit_page.hidden_label')}
        </label>
      </div>
    );
  }
}
