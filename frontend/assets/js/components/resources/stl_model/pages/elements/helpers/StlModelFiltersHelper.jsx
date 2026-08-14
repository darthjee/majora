import React from 'react';
import EnumSelectField from '../../../../../common/forms/EnumSelectField.jsx';
import MultiResourcePickerField from '../../../../../common/forms/MultiResourcePickerField.jsx';
import TagsField from '../../../../../common/forms/TagsField.jsx';
import Translator from '../../../../../../i18n/Translator.js';
import {
  TYPE_VALUES, RACE_VALUES, ROLE_VALUES, SIZE_VALUES,
} from '../../../stlModelEnums.js';

/**
 * Rendering helper for the StlModelFilters element.
 */
export default class StlModelFiltersHelper {
  /**
   * Renders the Name text input, Type/Size dropdowns, Races/Roles/Sources/Collections pickers,
   * Tags field, Query button and Clear button.
   *
   * @param {{name: string, type: string, size: string, races: {id: string, name: string}[],
   *   roles: {id: string, name: string}[], sources: {id: number, name: string}[],
   *   collections: {id: number, name: string}[], tags: string[], tagInput: string}} state -
   *   filters draft state.
   * @param {{onNameChange: Function, onTypeChange: Function, onSizeChange: Function,
   *   onRacesChange: Function, onRolesChange: Function, onSourcesChange: Function,
   *   onCollectionsChange: Function, onTagInputChange: Function, onAddTag: Function,
   *   onRemoveTag: Function, onQuery: Function, onClear: Function}} handlers - filters event
   *   handlers.
   * @returns {React.ReactElement} rendered filters bar.
   */
  static render(state, handlers) {
    return (
      <div className="mb-4" data-testid="stl-model-filters">
        {StlModelFiltersHelper.#renderScalarFields(state, handlers)}
        {StlModelFiltersHelper.#renderPickerFields(state, handlers)}
        {StlModelFiltersHelper.#renderTagsField(state, handlers)}
        {StlModelFiltersHelper.#renderActions(handlers)}
      </div>
    );
  }

  static #renderScalarFields(state, handlers) {
    return (
      <div className="row g-2 align-items-end mb-2">
        <div className="col-auto">
          <label htmlFor="stl-model-filter-name" className="form-label">
            {Translator.t('stl_models_page.filter_name_label')}
          </label>
          <input
            id="stl-model-filter-name"
            data-testid="stl-model-filter-name"
            type="text"
            className="form-control"
            placeholder={Translator.t('stl_models_page.filter_name_placeholder')}
            value={state.name}
            onChange={(event) => handlers.onNameChange(event.target.value)}
          />
        </div>
        <div className="col-auto">
          <EnumSelectField
            id="stl-model-filter-type"
            label={Translator.t('stl_models_page.filter_type_label')}
            values={TYPE_VALUES}
            translateOption={(value) => Translator.t(`stl_model_page.type_${value}`)}
            value={state.type}
            nullable
            noneLabel={Translator.t('stl_models_page.filter_type_none_option')}
            onChange={(event) => handlers.onTypeChange(event.target.value)}
          />
        </div>
        <div className="col-auto">
          <EnumSelectField
            id="stl-model-filter-size"
            label={Translator.t('stl_models_page.filter_size_label')}
            values={SIZE_VALUES}
            translateOption={(value) => Translator.t(`stl_model_page.size_${value}`)}
            value={state.size}
            nullable
            noneLabel={Translator.t('stl_models_page.filter_size_none_option')}
            onChange={(event) => handlers.onSizeChange(event.target.value)}
          />
        </div>
      </div>
    );
  }

  static #renderPickerFields(state, handlers) {
    return (
      <div className="row g-2 mb-2">
        <div className="col-md-6 col-lg-3">
          <MultiResourcePickerField
            values={RACE_VALUES}
            translateOption={(value) => Translator.t(`stl_model_page.race_${value}`)}
            value={state.races}
            onChange={handlers.onRacesChange}
            label={Translator.t('stl_models_page.filter_race_label')}
            searchPlaceholder={Translator.t('stl_models_page.filter_race_search_placeholder')}
            removeLabel={Translator.t('stl_models_page.filter_remove_label')}
          />
        </div>
        <div className="col-md-6 col-lg-3">
          <MultiResourcePickerField
            values={ROLE_VALUES}
            translateOption={(value) => Translator.t(`stl_model_page.role_${value}`)}
            value={state.roles}
            onChange={handlers.onRolesChange}
            label={Translator.t('stl_models_page.filter_roles_label')}
            searchPlaceholder={Translator.t('stl_models_page.filter_roles_search_placeholder')}
            removeLabel={Translator.t('stl_models_page.filter_remove_label')}
          />
        </div>
        <div className="col-md-6 col-lg-3">
          <MultiResourcePickerField
            resource="source"
            maxEntries={4}
            value={state.sources}
            onChange={handlers.onSourcesChange}
            label={Translator.t('stl_models_page.filter_source_label')}
            searchPlaceholder={Translator.t('stl_models_page.filter_source_search_placeholder')}
            removeLabel={Translator.t('stl_models_page.filter_remove_label')}
          />
        </div>
        <div className="col-md-6 col-lg-3">
          <MultiResourcePickerField
            resource="collection"
            maxEntries={4}
            value={state.collections}
            onChange={handlers.onCollectionsChange}
            label={Translator.t('stl_models_page.filter_collection_label')}
            searchPlaceholder={Translator.t('stl_models_page.filter_collection_search_placeholder')}
            removeLabel={Translator.t('stl_models_page.filter_remove_label')}
          />
        </div>
      </div>
    );
  }

  static #renderTagsField(state, handlers) {
    return (
      <div className="row g-2 mb-2">
        <div className="col-12 col-lg-6">
          <TagsField
            id="stl-model-filter-tags"
            label={Translator.t('stl_models_page.filter_tags_label')}
            placeholder={Translator.t('stl_models_page.filter_tags_placeholder')}
            addLabel={Translator.t('stl_models_page.filter_add_tag')}
            tags={state.tags}
            inputValue={state.tagInput}
            onInputChange={handlers.onTagInputChange}
            onAdd={handlers.onAddTag}
            onRemoveTag={handlers.onRemoveTag}
            removeTagLabel={Translator.t('stl_models_page.filter_remove_tag_tooltip')}
          />
        </div>
      </div>
    );
  }

  static #renderActions(handlers) {
    return (
      <div className="row g-2">
        <div className="col-auto">
          <button
            type="button"
            className="btn btn-primary"
            data-testid="stl-model-filter-query"
            onClick={handlers.onQuery}
          >
            {Translator.t('stl_models_page.filter_query')}
          </button>
        </div>
        <div className="col-auto">
          <button
            type="button"
            className="btn btn-outline-secondary"
            data-testid="stl-model-filter-clear"
            onClick={handlers.onClear}
          >
            {Translator.t('stl_models_page.filter_clear')}
          </button>
        </div>
      </div>
    );
  }
}
