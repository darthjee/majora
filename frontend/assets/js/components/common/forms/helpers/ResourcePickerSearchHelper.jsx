/**
 * Rendering helper for the `ResourcePickerSearch` element.
 */
export default class ResourcePickerSearchHelper {
  /**
   * Render the search input and its results list, each result rendered as an image+name row
   * (`photo_url`/`name`, matching `SourceListSerializer`/`CollectionListSerializer`'s shape).
   *
   * @param {{searchTerm: string, results: object[], searchPlaceholder: string}} state - Current
   *   search term, fetched results, and the caller-supplied translated placeholder.
   * @param {{onSearchChange: Function, onSelect: Function}} handlers - Change handler for the
   *   search input, and click handler for a result row (called with the picked item).
   * @returns {React.ReactElement} Rendered search input and results list.
   */
  static render(state, handlers) {
    return (
      <div className="resource-picker-search">
        <input
          type="text"
          className="form-control mb-2"
          placeholder={state.searchPlaceholder}
          value={state.searchTerm}
          onChange={(event) => handlers.onSearchChange(event.target.value)}
        />
        <div className="list-group">
          {state.results.map((item) => (
            <button
              key={item.id}
              type="button"
              className="list-group-item list-group-item-action d-flex align-items-center gap-2"
              onClick={() => handlers.onSelect(item)}
            >
              <img src={item.photo_url} alt={item.name} className="resource-picker-search-thumb" />
              <span>{item.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }
}
