import React from 'react';
import BackButton from '../../../../common/buttons/BackButton.jsx';
import FormField from '../../../../common/forms/FormField.jsx';
import SwitchField from '../../../../common/forms/SwitchField.jsx';
import EnumSelectField from '../../../../common/forms/EnumSelectField.jsx';
import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import SubmitButton from '../../../../common/buttons/SubmitButton.jsx';
import Translator from '../../../../../i18n/Translator.js';
import StlModelHelper from './StlModelHelper.jsx';
import { TYPE_VALUES, RACE_VALUES, ROLE_VALUES } from '../../stlModelEnums.js';

/**
 * Rendering helper for the STL model edit page. Shares the same `type`/`race`/`role`/`owned`
 * field pieces as `StlModelNewHelper.jsx` (both forms edit the same field set), but omits the
 * photo/tags/sources/collections fields — the update endpoint (issue #1069) only accepts
 * `name`/`owned`/`type`/`race`/`role`, matching the existing dedicated flows for the rest
 * (photo upload endpoint; no edit UI for tags/sources/collections).
 */
export default class StlModelEditHelper {
  /**
   * Render the STL model edit form.
   *
   * @param {{name: string, owned: boolean, type: string, race: string, role: string,
   *   status: string, fieldErrors: object}} formState - Form state. `race`/`role` are `''` for
   *   "no selection" (converted to `null` at the controller's request-body boundary).
   * @param {{onSubmit: Function, onNameChange: Function, onOwnedChange: Function,
   *   onTypeChange: Function, onRaceChange: Function, onRoleChange: Function}} handlers - Event
   *   handlers.
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
          {StlModelEditHelper.#renderEnumFields(formState, handlers)}
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

  static #renderEnumFields(formState, handlers) {
    return (
      <>
        <EnumSelectField
          id="stl-model-edit-type"
          label={Translator.t('stl_model_new_page.type_select_label')}
          values={TYPE_VALUES}
          translateOption={(value) => Translator.t(`stl_model_page.type_${value}`)}
          value={formState.type}
          onChange={handlers.onTypeChange}
        />
        <EnumSelectField
          id="stl-model-edit-race"
          label={Translator.t('stl_model_new_page.race_select_label')}
          values={RACE_VALUES}
          translateOption={(value) => Translator.t(`stl_model_page.race_${value}`)}
          value={formState.race}
          nullable
          noneLabel={Translator.t('stl_model_new_page.race_select_none_option')}
          onChange={handlers.onRaceChange}
        />
        <EnumSelectField
          id="stl-model-edit-role"
          label={Translator.t('stl_model_new_page.role_select_label')}
          values={ROLE_VALUES}
          translateOption={(value) => Translator.t(`stl_model_page.role_${value}`)}
          value={formState.role}
          nullable
          noneLabel={Translator.t('stl_model_new_page.role_select_none_option')}
          onChange={handlers.onRoleChange}
        />
      </>
    );
  }

  static #renderError(formState) {
    if (formState.status !== 'error') {
      return null;
    }

    return <ErrorAlert error={Translator.t('stl_model_edit_page.error')} />;
  }
}
