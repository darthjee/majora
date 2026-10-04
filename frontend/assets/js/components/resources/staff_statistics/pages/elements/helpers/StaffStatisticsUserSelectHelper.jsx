import Form from 'react-bootstrap/cjs/Form.js';
import ListGroup from 'react-bootstrap/cjs/ListGroup.js';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Translates a filter key of the `staff_statistics_page` namespace.
 *
 * @param {string} key - Key under `staff_statistics_page.filters`.
 * @returns {string} The translated text.
 */
function t(key) {
  return Translator.t(`staff_statistics_page.filters.${key}`);
}

/**
 * Rendering helper for the `StaffStatisticsUserSelect` element.
 */
export default class StaffStatisticsUserSelectHelper {
  /**
   * Renders the selected user (with a clear button) or the search input and its results.
   *
   * @param {{id: (string|undefined), value: (string|null), selected: (object|null),
   *   searchTerm: string, results: object[], searched: boolean}} state - Select state:
   *   input id, selected user id, its resolved label (`{id, name, deleted}`), search text,
   *   search results and whether a search completed.
   * @param {{onSearchChange: Function, onSelect: Function, onClear: Function}} handlers -
   *   Search input change, result click (called with the user) and clear handlers.
   * @returns {React.ReactElement} Rendered user select.
   */
  static render(state, handlers) {
    return (
      <div className="statistics-user-select" data-testid="statistics-user-select">
        {state.value
          ? StaffStatisticsUserSelectHelper.#renderSelected(state, handlers)
          : StaffStatisticsUserSelectHelper.#renderSearch(state, handlers)}
      </div>
    );
  }

  static #renderSelected(state, handlers) {
    return (
      <div className="input-group" data-testid="statistics-user-selected">
        <span className="form-control">{StaffStatisticsUserSelectHelper.#renderSelectedLabel(state)}</span>
        <button
          type="button"
          className="btn btn-outline-secondary"
          data-testid="statistics-user-clear"
          onClick={handlers.onClear}
        >
          {t('user_clear')}
        </button>
      </div>
    );
  }

  static #renderSelectedLabel({ value, selected }) {
    if (selected?.id === value && selected.name) return selected.name;

    return (
      <>
        {`#${value}`}
        {selected?.id === value && selected.deleted && (
          <small className="text-muted ms-1" data-testid="statistics-user-deleted">
            ({t('user_deleted')})
          </small>
        )}
      </>
    );
  }

  static #renderSearch(state, handlers) {
    return (
      <>
        <Form.Control
          id={state.id}
          type="text"
          data-testid="statistics-user-search"
          placeholder={t('user_search_placeholder')}
          value={state.searchTerm}
          onChange={(event) => handlers.onSearchChange(event.target.value)}
        />
        {StaffStatisticsUserSelectHelper.#renderResults(state, handlers)}
      </>
    );
  }

  static #renderResults(state, handlers) {
    if (!state.searchTerm.trim() || !state.searched) return null;

    if (state.results.length === 0) {
      return (
        <ListGroup className="mt-1" data-testid="statistics-user-results">
          <ListGroup.Item className="text-muted">{t('user_no_results')}</ListGroup.Item>
        </ListGroup>
      );
    }

    return (
      <ListGroup className="mt-1" data-testid="statistics-user-results">
        {state.results.map((user) => (
          <ListGroup.Item key={user.id} action as="button" type="button" onClick={() => handlers.onSelect(user)}>
            <span>{user.name}</span>
            <small className="text-muted ms-2">{user.email}</small>
          </ListGroup.Item>
        ))}
      </ListGroup>
    );
  }
}
