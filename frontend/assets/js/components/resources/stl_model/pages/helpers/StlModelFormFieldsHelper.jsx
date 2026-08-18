import React from 'react';
import FormField from '../../../../common/forms/FormField.jsx';
import EnumSelectField from '../../../../common/forms/EnumSelectField.jsx';
import MultiResourcePickerField from '../../../../common/forms/MultiResourcePickerField.jsx';
import Translator from '../../../../../i18n/Translator.js';
import {
  TYPE_VALUES, RACE_VALUES, ROLE_VALUES, SIZE_VALUES,
} from '../../stlModelEnums.js';

/**
 * Renders the `type`/`races`/`roles`/`url`/`size` field pieces shared verbatim by
 * `StlModelNewHelper.jsx` and `StlModelEditHelper.jsx` (both forms edit the same field set) —
 * extracted here so the shared shape lives in one place instead of two near-identical
 * `#renderEnumFields` copies.
 */
export default class StlModelFormFieldsHelper {
  /**
   * Render the `type`/`races`/`roles`/`url`/`size` fields.
   *
   * @param {{type: string, races: {id: string, name: string}[],
   *   roles: {id: string, name: string}[], url: string, size: string,
   *   fieldErrors: object}} formState - Current field values. `races`/`roles` are `{id, name}`-
   *   keyed picks (`id` is the raw constant string). `size` is `''` for "no selection" (converted
   *   to `null` at the controller's request-body boundary).
   * @param {{onTypeChange: Function, onRacesChange: Function, onRolesChange: Function,
   *   onUrlChange: Function, onSizeChange: Function}} handlers - Event handlers.
   * @param {string} idPrefix - Id prefix distinguishing the new/edit forms' input ids
   *   (e.g. `'stl-model-new'`, `'stl-model-edit'`).
   * @returns {React.ReactElement} Rendered field pieces.
   */
  static render(formState, handlers, idPrefix) {
    return (
      <>
        <EnumSelectField
          id={`${idPrefix}-type`}
          label={Translator.t('stl_model_new_page.type_select_label')}
          values={TYPE_VALUES}
          translateOption={(value) => Translator.t(`stl_model_page.type_${value}`)}
          value={formState.type}
          onChange={handlers.onTypeChange}
        />
        <MultiResourcePickerField
          picker={{ values: RACE_VALUES, translateOption: (value) => Translator.t(`stl_model_page.race_${value}`) }}
          value={formState.races}
          onChange={handlers.onRacesChange}
          label={Translator.t('stl_model_new_page.races_label')}
          searchPlaceholder={Translator.t('stl_model_new_page.races_search_placeholder')}
          removeLabel={Translator.t('stl_model_new_page.remove_tag_tooltip')}
        />
        <MultiResourcePickerField
          picker={{ values: ROLE_VALUES, translateOption: (value) => Translator.t(`stl_model_page.role_${value}`) }}
          value={formState.roles}
          onChange={handlers.onRolesChange}
          label={Translator.t('stl_model_new_page.roles_label')}
          searchPlaceholder={Translator.t('stl_model_new_page.roles_search_placeholder')}
          removeLabel={Translator.t('stl_model_new_page.remove_tag_tooltip')}
        />
        <FormField
          id={`${idPrefix}-url`}
          type="url"
          label={Translator.t('stl_model_new_page.url_label')}
          value={formState.url}
          onChange={handlers.onUrlChange}
          errors={formState.fieldErrors.url ?? []}
        />
        <EnumSelectField
          id={`${idPrefix}-size`}
          label={Translator.t('stl_model_new_page.size_select_label')}
          values={SIZE_VALUES}
          translateOption={(value) => Translator.t(`stl_model_page.size_${value}`)}
          value={formState.size}
          nullable
          noneLabel={Translator.t('stl_model_new_page.size_select_none_option')}
          onChange={handlers.onSizeChange}
        />
      </>
    );
  }
}
