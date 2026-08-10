import React from 'react';
import ListPage from '../../../../common/list_page/ListPage.jsx';
import PageActions from '../../../../common/list_page/PageActions.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the STL models listing page.
 */
export default class StlModelsHelper {
  /**
   * Render the STL models page: header (back button, plus a "New STL model" action only when the
   * viewer is staff or a superuser) and the shared `ListPage` grid (type `stlModels`).
   *
   * @param {boolean} isStaffOrSuperUser - Whether the current viewer may create STL models.
   * @param {number} refreshToken - Opaque value bumped to re-trigger the list fetch (e.g. after
   *   the "New STL model" modal succeeds).
   * @param {{onNewClick: Function}} handlers - Page event handlers; `onNewClick` opens the "New
   *   STL model" modal.
   * @returns {React.ReactElement} Rendered STL models page.
   */
  static render(isStaffOrSuperUser, refreshToken, handlers) {
    return (
      <>
        <div className="container mt-4">
          <PageActions backHref="#/">
            {StlModelsHelper.#renderNewButton(isStaffOrSuperUser, handlers)}
          </PageActions>
        </div>
        <ListPage
          type="stlModels"
          basePath="#/miniatures/stl_models"
          loadingMessage={Translator.t('stl_models_page.loading')}
          refreshToken={refreshToken}
        />
      </>
    );
  }

  static #renderNewButton(isStaffOrSuperUser, handlers) {
    if (!isStaffOrSuperUser) {
      return null;
    }

    return (
      <button type="button" className="btn btn-primary mb-3" onClick={handlers.onNewClick}>
        {Translator.t('stl_models_page.new_stl_model')}
      </button>
    );
  }
}
