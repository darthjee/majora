import React from 'react';
import ListPage from '../../../../common/list_page/ListPage.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import NewButton from '../../../../common/buttons/NewButton.jsx';
import PageActions from '../../../../common/list_page/PageActions.jsx';
import PhotoUploadModal from '../../../../common/modals/PhotoUploadModal.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the Treasures listing page.
 */
export default class TreasuresHelper {
  /**
   * Render the treasures page: header (back button, "New Treasure" action, always shown since
   * this page is already staff/superuser-only), the shared `ListPage` grid (type
   * `treasures-global`), and the photo upload modal.
   *
   * @param {object} state - Page state.
   * @param {string} state.basePath - Base hash path for the treasures list.
   * @param {number} state.refreshToken - Opaque value bumped to re-trigger the list fetch.
   * @param {object} state.activeFilters - Active filter query params preserved on pagination links.
   * @param {boolean} state.showUploadModal - Whether the photo upload modal is visible.
   * @param {object|null} state.selectedTreasure - Treasure currently targeted by the upload modal.
   * @param {object} handlers - Page event handlers.
   * @param {Function} handlers.onUploadClick - Called with a treasure when its upload button is clicked.
   * @param {Function} handlers.onUploadClose - Called when the upload modal is dismissed.
   * @param {Function} handlers.onUploadSuccess - Called after a successful photo upload.
   * @param {Function} handlers.onFilterQuery - Called with the built filter query object.
   * @param {Function} handlers.onFilterClear - Called when the filters are cleared.
   * @returns {React.ReactElement} Rendered treasures page.
   */
  static render(state, handlers) {
    return (
      <>
        <div className="container mt-4">
          <PageActions backHref="#/">
            <NewButton href="#/treasures/new">
              {Translator.t('treasures_page.new_treasure')}
            </NewButton>
          </PageActions>
        </div>
        <ListPage
          type="treasures-global"
          basePath={state.basePath}
          loadingMessage={Translator.t('treasures_page.loading')}
          context={{ onUploadClick: handlers.onUploadClick }}
          filtersProps={{ onQuery: handlers.onFilterQuery, onClear: handlers.onFilterClear }}
          activeFilters={state.activeFilters}
          refreshToken={state.refreshToken}
        />
        <PhotoUploadModal
          show={state.showUploadModal}
          uploadPath={`/treasures/${state.selectedTreasure?.id}/photo_upload.json`}
          onClose={handlers.onUploadClose}
          onSuccess={handlers.onUploadSuccess}
        />
      </>
    );
  }

  /**
   * Render the loading state.
   *
   * @returns {React.ReactElement} Loading message.
   */
  static renderLoading() {
    return <LoadingMessage message={Translator.t('treasures_page.loading')} />;
  }
}
