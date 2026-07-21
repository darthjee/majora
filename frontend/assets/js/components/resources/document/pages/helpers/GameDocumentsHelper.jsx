import React from 'react';
import PageActions from '../../../../common/list_page/PageActions.jsx';
import ListPage from '../../../../common/list_page/ListPage.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the Game Documents listing page.
 */
export default class GameDocumentsHelper {
  /**
   * Render the documents page: header (back button, heading) and the shared `ListPage` grid
   * (type `documents`). Read-only (issue #725): no "New"/"Add" action or upload modal, no
   * detail page to link to, mirroring `GameItemsHelper`.
   *
   * @param {object} state - Page state.
   * @param {string} state.gameSlug - Current game slug.
   * @param {string} state.basePath - Base hash path for the documents list.
   * @param {string} state.backHref - Hash path to the parent game page.
   * @returns {React.ReactElement} Rendered documents page.
   */
  static render(state) {
    return (
      <>
        <div className="container mt-4">
          <PageActions backHref={state.backHref} />
          <h1 className="mb-4">{Translator.t('game_documents_page.title')}</h1>
        </div>
        <ListPage
          type="documents"
          gameSlug={state.gameSlug}
          basePath={state.basePath}
          loadingMessage={Translator.t('game_documents_page.loading')}
        />
      </>
    );
  }
}
