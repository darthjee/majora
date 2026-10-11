import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import PageActions from '../../../../common/list_page/PageActions.jsx';
import Translator from '../../../../../i18n/Translator.js';
import StaffCopyGameSelect from '../elements/StaffCopyGameSelect.jsx';
import StaffCopyTabs from '../elements/StaffCopyTabs.jsx';
import StaffCopySourceList from '../elements/StaffCopySourceList.jsx';

const PREFIX = 'staff_copies_page';

/**
 * Rendering helper for the staff copy page (issue #1571).
 */
export default class StaffCopiesHelper {
  /**
   * Render the staff copy page: title, source/target selectors, then either the empty-types
   * message or the type tabs plus the list body (hint, validation/list error or source list).
   *
   * @param {object} state - Page state.
   * @param {string[]} state.types - Available copy type slugs.
   * @param {object[]} state.games - Available games.
   * @param {{type: string, from: string, to: string}} state.selection - Current selection.
   * @param {object[]} state.rows - Source rows of the current page.
   * @param {object} state.pagination - Pagination.
   * @param {string|null} state.listError - i18n key of the list / validation error.
   * @param {number[]} state.selectedIds - Selected row ids.
   * @param {boolean} [state.running] - Whether a copy run is in progress.
   * @param {{onSelectGame: Function, onToggle: Function, onToggleAll: Function,
   *   onCopy: Function}} handlers - Selector, selection and copy handlers.
   * @returns {React.ReactElement} Staff copy page content.
   */
  static render(state, handlers) {
    const { games, selection, running = false } = state;

    return (
      <div className="container mt-4">
        <PageActions backHref="#/" />
        <h1>{Translator.t(`${PREFIX}.title`)}</h1>
        <div className="row g-3 mb-3">
          {['from', 'to'].map((key) => (
            <StaffCopyGameSelect
              key={key}
              id={`staff-copy-${key}`}
              labelKey={`${PREFIX}.${key === 'from' ? 'source' : 'target'}_label`}
              games={games}
              value={selection[key]}
              disabled={running}
              onChange={(slug) => handlers.onSelectGame(key, slug)}
            />
          ))}
        </div>
        {StaffCopiesHelper.#renderContent(state, handlers)}
      </div>
    );
  }

  /**
   * Render the loading state.
   *
   * @returns {React.ReactElement} Loading message.
   */
  static renderLoading() {
    return <LoadingMessage message={Translator.t(`${PREFIX}.loading`)} />;
  }

  /**
   * Render the load error state.
   *
   * @param {string} errorKey - i18n key of the error message.
   * @returns {React.ReactElement} Error alert.
   */
  static renderError(errorKey) {
    return <ErrorAlert error={Translator.t(errorKey)} />;
  }

  /**
   * Render the empty-types message, or the tabs plus the list body.
   *
   * @param {object} state - Page state.
   * @param {object} handlers - Page handlers.
   * @returns {React.ReactElement} Content below the selectors.
   */
  static #renderContent(state, handlers) {
    if (state.types.length === 0) return <p className="text-muted">{Translator.t(`${PREFIX}.no_types`)}</p>;

    return (
      <>
        <StaffCopyTabs types={state.types} selection={state.selection} />
        {StaffCopiesHelper.#renderBody(state, handlers)}
      </>
    );
  }

  /**
   * Render the hint until both games are selected, the validation / list error, or the list.
   *
   * @param {object} state - Page state.
   * @param {object} handlers - Page handlers.
   * @returns {React.ReactElement} List body.
   */
  static #renderBody(state, handlers) {
    const { selection, listError } = state;

    if (listError) return <ErrorAlert error={Translator.t(listError)} />;
    if (!selection.from || !selection.to) {
      return <p className="text-muted">{Translator.t(`${PREFIX}.select_games_hint`)}</p>;
    }

    return (
      <StaffCopySourceList
        selection={selection}
        rows={state.rows}
        pagination={state.pagination}
        selectedIds={state.selectedIds}
        running={Boolean(state.running)}
        handlers={handlers}
      />
    );
  }
}
