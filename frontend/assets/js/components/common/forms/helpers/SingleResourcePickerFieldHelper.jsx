import ResourcePickerSearch from '../ResourcePickerSearch.jsx';
import FieldErrors from '../FieldErrors.jsx';
import Badge from '../../badges/Badge.jsx';
import Translator from '../../../../i18n/Translator.js';

/**
 * Rendering helper for the `SingleResourcePickerField` element.
 */
export default class SingleResourcePickerFieldHelper {
  /**
   * Render the field's label plus either the search core (no value picked, or re-picking) or the
   * picked item as a plain badge, followed by the field's errors. The wrapper carries the blur
   * handler that cancels re-picking when focus leaves the field.
   *
   * @param {{picker: object, value: ({id: (number|string), name: string}|null), label: string,
   *   searchPlaceholder: string, searching: boolean, errors: string[], id: (string|undefined)}}
   *   state - Field state; `picker` is either `{resource, maxEntries, params}` (API mode) or
   *   `{values, translateOption}` (constant mode), and `id` is the wrapper's optional DOM id.
   * @param {{onSelect: Function, onReopenSearch: Function, onCancel: Function,
   *   onBlur: Function, onClear: (Function|undefined)}} handlers - Selection handler (search
   *   core), click handler to re-open the search from the badge view, `Escape` cancel handler,
   *   the wrapper's blur handler, and the optional clear handler (renders the clear button next
   *   to the picked badge when given).
   * @returns {React.ReactElement} Rendered single resource picker field.
   */
  static render(state, handlers) {
    return (
      <div id={state.id} className="mb-3" onBlur={handlers.onBlur}>
        <span className="form-label d-block">{state.label}</span>
        {SingleResourcePickerFieldHelper.#renderBody(state, handlers)}
        <FieldErrors errors={state.errors} />
      </div>
    );
  }

  static #renderBody(state, handlers) {
    if (!state.value) {
      return SingleResourcePickerFieldHelper.#renderSearch(state, handlers, false);
    }

    if (state.searching) {
      return SingleResourcePickerFieldHelper.#renderSearch(state, handlers, true);
    }

    return (
      <span className="d-inline-flex align-items-center">
        <button type="button" className="btn btn-link p-0" onClick={handlers.onReopenSearch}>
          <Badge text={state.value.name} />
        </button>
        {SingleResourcePickerFieldHelper.#renderClearButton(handlers)}
      </span>
    );
  }

  static #renderClearButton(handlers) {
    if (!handlers.onClear) {
      return null;
    }

    const clearLabel = Translator.t('resource_picker.clear');

    return (
      <button
        type="button"
        className="btn btn-link btn-sm p-0 ms-1 text-decoration-none"
        aria-label={clearLabel}
        title={clearLabel}
        onClick={() => handlers.onClear()}
      >
        ×
      </button>
    );
  }

  static #renderSearch(state, handlers, repicking) {
    const {
      resource, maxEntries, params, values, translateOption,
    } = state.picker;

    return (
      <ResourcePickerSearch
        resource={resource}
        maxEntries={maxEntries}
        params={params}
        values={values}
        translateOption={translateOption}
        searchPlaceholder={state.searchPlaceholder}
        onSelect={handlers.onSelect}
        onCancel={repicking ? handlers.onCancel : undefined}
        autoFocus={repicking}
      />
    );
  }
}
