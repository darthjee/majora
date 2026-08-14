import React from 'react';
import ListPage from '../../../../common/list_page/ListPage.jsx';
import PageActions from '../../../../common/list_page/PageActions.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the STL models listing page.
 */
export default class StlModelsHelper {
  /**
   * Render the STL models page: header (back button, plus a "New STL model" link only when the
   * viewer is staff or a superuser) and the shared `ListPage` grid (type `stlModels`), including
   * its `StlModelFilters` bar (issue #1107).
   *
   * @param {{isStaffOrSuperUser: boolean, refreshToken: number,
   *   activeFilters: URLSearchParams}} state - Page state. `isStaffOrSuperUser` gates the "New
   *   STL model" action. `refreshToken` re-triggers the list fetch on every filter query/clear.
   *   `activeFilters` is preserved on every pagination link.
   * @param {{onFilterQuery: Function, onFilterClear: Function}} handlers - Filters bar event
   *   handlers.
   * @returns {React.ReactElement} Rendered STL models page.
   */
  static render(state, handlers) {
    return (
      <>
        <div className="container mt-4">
          <PageActions backHref="#/">
            {StlModelsHelper.#renderNewButton(state.isStaffOrSuperUser)}
          </PageActions>
        </div>
        <ListPage
          type="stlModels"
          basePath="#/miniatures/stl_models"
          loadingMessage={Translator.t('stl_models_page.loading')}
          filtersProps={{ onQuery: handlers.onFilterQuery, onClear: handlers.onFilterClear }}
          activeFilters={state.activeFilters}
          refreshToken={state.refreshToken}
        />
      </>
    );
  }

  static #renderNewButton(isStaffOrSuperUser) {
    if (!isStaffOrSuperUser) {
      return null;
    }

    return (
      <a href="#/miniatures/stl_models/new" className="btn btn-primary mb-3">
        {Translator.t('stl_models_page.new_stl_model')}
      </a>
    );
  }
}
