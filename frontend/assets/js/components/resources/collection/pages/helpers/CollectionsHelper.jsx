import React from 'react';
import ListPage from '../../../../common/list_page/ListPage.jsx';
import PageActions from '../../../../common/list_page/PageActions.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the collections listing page.
 */
export default class CollectionsHelper {
  /**
   * Render the collections page: header (back button, plus a "New Collection" action only when
   * the viewer is staff or a superuser) and the shared `ListPage` grid (type `collections`).
   *
   * @param {boolean} isStaffOrSuperUser - Whether the current viewer may create collections.
   * @param {number} refreshToken - Opaque value bumped to re-trigger the list fetch (e.g. after
   *   the "New Collection" modal succeeds).
   * @param {{onNewClick: Function}} handlers - Page event handlers; `onNewClick` opens the "New
   *   Collection" modal.
   * @returns {React.ReactElement} Rendered collections page.
   */
  static render(isStaffOrSuperUser, refreshToken, handlers) {
    return (
      <>
        <div className="container mt-4">
          <PageActions backHref="#/">
            {CollectionsHelper.#renderNewButton(isStaffOrSuperUser, handlers)}
          </PageActions>
        </div>
        <ListPage
          type="collections"
          basePath="#/miniatures/collections"
          loadingMessage={Translator.t('collections_page.loading')}
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
        {Translator.t('collections_page.new_collection')}
      </button>
    );
  }
}
