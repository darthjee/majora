/**
 * Rendering helper for the `ResourcePickerSearch` element.
 */
export default class ResourcePickerSearchHelper {
  /**
   * Render the search input and its results list, each result rendered as a name row
   * (`name`, matching `SourceListSerializer`/`CollectionListSerializer`'s shape), preceded by a
   * thumbnail only when the result carries a `photo_url` — constant-mode results
   * (`ResourcePickerSearch`'s `values`/`translateOption` pair, e.g. races/roles) have no
   * `photo_url` at all, so no thumbnail (broken-image icon) is rendered for them.
   *
   * Result rows swallow `mousedown` (`preventDefault`) so clicking one keeps focus on the search
   * input: the click still selects the row before any blur-based cancel can close the search.
   *
   * @param {{searchTerm: string, results: object[], searchPlaceholder: string,
   *   autoFocus: boolean}} state - Current search term, fetched results, the caller-supplied
   *   translated placeholder, and whether the input grabs focus on mount.
   * @param {{onSearchChange: Function, onSelect: Function, onKeyDown: Function}} handlers -
   *   Change handler for the search input, click handler for a result row (called with the
   *   picked item), and keydown handler for the search input.
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
          autoFocus={state.autoFocus}
          onChange={(event) => handlers.onSearchChange(event.target.value)}
          onKeyDown={handlers.onKeyDown}
        />
        <div className="list-group">
          {state.results.map((item) => (
            <button
              key={item.id}
              type="button"
              className="list-group-item list-group-item-action d-flex align-items-center gap-2"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => handlers.onSelect(item)}
            >
              {item.photo_url && (
                <img src={item.photo_url} alt={item.name} className="resource-picker-search-thumb" />
              )}
              <span>{item.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }
}
