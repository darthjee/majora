import React from 'react';
import PageActions from '../../../../common/list_page/PageActions.jsx';
import NewButton from '../../../../common/buttons/NewButton.jsx';
import ListPage from '../../../../common/list_page/ListPage.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the Game Documents listing page.
 */
export default class GameDocumentsHelper {
  /**
   * Render the documents page: header (back button, "Create Document" action gated on
   * `state.canCreateDocument`, heading) and the shared `ListPage` grid (type `documents`). The
   * list itself has no per-row edit action; document creation (issue #758) is the only
   * DM/admin/staff-gated action on this page, mirroring `GameItemsHelper`.
   *
   * @param {object} state - Page state.
   * @param {string} state.gameSlug - Current game slug.
   * @param {string} state.basePath - Base hash path for the documents list.
   * @param {string} state.backHref - Hash path to the parent game page.
   * @param {string} state.newHref - Hash path to the new document form.
   * @param {boolean} state.canCreateDocument - Whether the current user may create a new
   *   document.
   * @returns {React.ReactElement} Rendered documents page.
   */
  static render(state) {
    return (
      <>
        <div className="container mt-4">
          <PageActions backHref={state.backHref}>
            {GameDocumentsHelper.#renderNewButton(state)}
          </PageActions>
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

  static #renderNewButton(state) {
    if (!state.canCreateDocument) {
      return null;
    }

    return (
      <NewButton href={state.newHref}>
        {Translator.t('game_documents_page.create_document')}
      </NewButton>
    );
  }
}
