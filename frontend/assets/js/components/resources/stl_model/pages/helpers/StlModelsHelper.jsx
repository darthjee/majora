import React from 'react';
import ListPage from '../../../../common/list_page/ListPage.jsx';
import PageActions from '../../../../common/list_page/PageActions.jsx';
import NewButton from '../../../../common/buttons/NewButton.jsx';
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
   * @returns {React.ReactElement} Rendered STL models page.
   */
  static render(isStaffOrSuperUser) {
    return (
      <>
        <div className="container mt-4">
          <PageActions backHref="#/">
            {StlModelsHelper.#renderNewButton(isStaffOrSuperUser)}
          </PageActions>
        </div>
        <ListPage
          type="stlModels"
          basePath="#/stl_models"
          loadingMessage={Translator.t('stl_models_page.loading')}
        />
      </>
    );
  }

  static #renderNewButton(isStaffOrSuperUser) {
    if (!isStaffOrSuperUser) {
      return null;
    }

    return (
      <NewButton href="#/stl_models/new">
        {Translator.t('stl_models_page.new_stl_model')}
      </NewButton>
    );
  }
}
