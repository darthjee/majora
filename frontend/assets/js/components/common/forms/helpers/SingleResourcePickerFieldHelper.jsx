import ResourcePickerSearch from '../ResourcePickerSearch.jsx';
import FieldErrors from '../FieldErrors.jsx';
import Badge from '../../badges/Badge.jsx';

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
   *   searchPlaceholder: string, searching: boolean, errors: string[]}} state - Field state;
   *   `picker` is either `{resource, maxEntries}` (API mode) or `{values, translateOption}`
   *   (constant mode).
   * @param {{onSelect: Function, onReopenSearch: Function, onCancel: Function,
   *   onBlur: Function}} handlers - Selection handler (search core), click handler to re-open
   *   the search from the badge view, `Escape` cancel handler, and the wrapper's blur handler.
   * @returns {React.ReactElement} Rendered single resource picker field.
   */
  static render(state, handlers) {
    return (
      <div className="mb-3" onBlur={handlers.onBlur}>
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
      <button type="button" className="btn btn-link p-0" onClick={handlers.onReopenSearch}>
        <Badge text={state.value.name} />
      </button>
    );
  }

  static #renderSearch(state, handlers, repicking) {
    const { resource, maxEntries, values, translateOption } = state.picker;

    return (
      <ResourcePickerSearch
        resource={resource}
        maxEntries={maxEntries}
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
