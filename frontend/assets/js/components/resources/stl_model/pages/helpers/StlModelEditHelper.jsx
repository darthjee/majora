import React from 'react';
import BackButton from '../../../../common/buttons/BackButton.jsx';
import FormField from '../../../../common/forms/FormField.jsx';
import SwitchField from '../../../../common/forms/SwitchField.jsx';
import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import SubmitButton from '../../../../common/buttons/SubmitButton.jsx';
import Translator from '../../../../../i18n/Translator.js';
import StlModelHelper from './StlModelHelper.jsx';
import StlModelFormFieldsHelper from './StlModelFormFieldsHelper.jsx';

/**
 * Rendering helper for the STL model edit page. Shares the same `type`/`races`/`roles`/`url`/
 * `size`/`owned` field pieces as `StlModelNewHelper.jsx` (both forms edit the same field set,
 * via `StlModelFormFieldsHelper.jsx`), but omits the photo/tags/sources/collections fields — the
 * update endpoint only accepts `name`/`owned`/`type`/`url`/`size`/`races`/`roles`, matching the
 * existing dedicated flows for the rest (photo upload endpoint; no edit UI for
 * tags/sources/collections).
 */
export default class StlModelEditHelper {
  /**
   * Render the STL model edit form.
   *
   * @param {{name: string, owned: boolean, type: string, races: {id: string, name: string}[],
   *   roles: {id: string, name: string}[], url: string, size: string, status: string,
   *   fieldErrors: object}} formState - Form state. `size` is `''` for "no selection" (converted
   *   to `null` at the controller's request-body boundary).
   * @param {{onSubmit: Function, onNameChange: Function, onOwnedChange: Function,
   *   onTypeChange: Function, onRacesChange: Function, onRolesChange: Function,
   *   onUrlChange: Function, onSizeChange: Function}} handlers - Event handlers.
   * @returns {React.ReactElement} Rendered edit page.
   */
  static render(formState, handlers) {
    return (
      <div className="container mt-4">
        <BackButton href="#/miniatures/stl_models" />
        <h1 className="mt-3">{Translator.t('stl_model_edit_page.title')}</h1>
        {StlModelEditHelper.#renderError(formState)}
        <form onSubmit={handlers.onSubmit}>
          <FormField
            id="stl-model-edit-name"
            type="text"
            label={Translator.t('stl_model_new_page.name_label')}
            value={formState.name}
            onChange={handlers.onNameChange}
            errors={formState.fieldErrors.name ?? []}
          />
          <SwitchField
            id="stl-model-edit-owned"
            label={Translator.t('stl_model_new_page.owned_switch_label')}
            checked={formState.owned}
            onChange={handlers.onOwnedChange}
          />
          {StlModelFormFieldsHelper.render(formState, handlers, 'stl-model-edit')}
          <SubmitButton disabled={formState.status === 'submitting'}>
            {Translator.t('stl_model_edit_page.submit')}
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

    return <ErrorAlert error={Translator.t('stl_model_edit_page.error')} />;
  }
}
