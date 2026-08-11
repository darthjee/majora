import ResourcePickerSearch from '../ResourcePickerSearch.jsx';
import Badge from '../../badges/Badge.jsx';

/**
 * Rendering helper for the `SingleResourcePickerField` element.
 */
export default class SingleResourcePickerFieldHelper {
  /**
   * Render the field's label plus either the search core (no value picked, or re-picking) or the
   * picked item as a plain badge.
   *
   * @param {{resource: string, maxEntries: number, value: ({id: number, name: string}|null),
   *   label: string, searchPlaceholder: string, searching: boolean}} state - Field state.
   * @param {{onSelect: Function, onReopenSearch: Function}} handlers - Selection handler (search
   *   core) and click handler to re-open the search from the badge view.
   * @returns {React.ReactElement} Rendered single resource picker field.
   */
  static render(state, handlers) {
    return (
      <div className="mb-3">
        <span className="form-label d-block">{state.label}</span>
        {SingleResourcePickerFieldHelper.#renderBody(state, handlers)}
      </div>
    );
  }

  static #renderBody(state, handlers) {
    if (!state.value || state.searching) {
      return (
        <ResourcePickerSearch
          resource={state.resource}
          maxEntries={state.maxEntries}
          searchPlaceholder={state.searchPlaceholder}
          onSelect={handlers.onSelect}
        />
      );
    }

    return (
      <button type="button" className="btn btn-link p-0" onClick={handlers.onReopenSearch}>
        <Badge text={state.value.name} />
      </button>
    );
  }
}
