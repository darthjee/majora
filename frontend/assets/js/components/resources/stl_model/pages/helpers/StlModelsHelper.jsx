import React from 'react';
import ListPage from '../../../../common/list_page/ListPage.jsx';
import PageActions from '../../../../common/list_page/PageActions.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the STL models listing page.
 */
export default class StlModelsHelper {
  /**
   * Render the STL models page: header (back button, no "New" action since no create endpoint
   * exists for `stl_models`) and the shared `ListPage` grid (type `stlModels`).
   *
   * @returns {React.ReactElement} Rendered STL models page.
   */
  static render() {
    return (
      <>
        <div className="container mt-4">
          <PageActions backHref="#/" />
        </div>
        <ListPage
          type="stlModels"
          basePath="#/stl_models"
          loadingMessage={Translator.t('stl_models_page.loading')}
        />
      </>
    );
  }
}
