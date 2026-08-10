import React from 'react';
import ListPage from '../../../../common/list_page/ListPage.jsx';
import PageActions from '../../../../common/list_page/PageActions.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the sources listing page.
 */
export default class SourcesHelper {
  /**
   * Render the sources page: header (back button, plus a "New Source" action only when the
   * viewer is staff or a superuser) and the shared `ListPage` grid (type `sources`).
   *
   * @param {boolean} isStaffOrSuperUser - Whether the current viewer may create sources.
   * @param {number} refreshToken - Opaque value bumped to re-trigger the list fetch (e.g. after
   *   the "New Source" modal succeeds).
   * @param {{onNewClick: Function}} handlers - Page event handlers; `onNewClick` opens the "New
   *   Source" modal.
   * @returns {React.ReactElement} Rendered sources page.
   */
  static render(isStaffOrSuperUser, refreshToken, handlers) {
    return (
      <>
        <div className="container mt-4">
          <PageActions backHref="#/">
            {SourcesHelper.#renderNewButton(isStaffOrSuperUser, handlers)}
          </PageActions>
        </div>
        <ListPage
          type="sources"
          basePath="#/miniatures/sources"
          loadingMessage={Translator.t('sources_page.loading')}
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
        {Translator.t('sources_page.new_source')}
      </button>
    );
  }
}
