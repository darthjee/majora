import React from 'react';
import PageActions from '../../../../common/list_page/PageActions.jsx';
import NewButton from '../../../../common/buttons/NewButton.jsx';
import ListPage from '../../../../common/list_page/ListPage.jsx';
import PhotoUploadModal from '../../../../common/modals/PhotoUploadModal.jsx';
import AddGameTreasureModal from '../elements/AddGameTreasureModal.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the Game Treasures listing page.
 */
export default class GameTreasuresHelper {
  /**
   * Render the treasures page: header (back button, "New"/"Add Treasure" actions, heading),
   * the shared `ListPage` grid (type `treasures`), and the upload/add modals.
   *
   * @param {object} state - Page state.
   * @param {string} state.gameSlug - Current game slug.
   * @param {string} state.basePath - Base hash path for the treasures list.
   * @param {string} state.backHref - Hash path to the parent game page.
   * @param {string} state.newHref - Hash path to the new treasure form.
   * @param {boolean} state.canEdit - Whether the current user may create/manage treasures.
   * @param {number} state.refreshToken - Opaque value bumped to re-trigger the list fetch.
   * @param {object} state.activeFilters - Active filter query params preserved on pagination links.
   * @param {boolean} state.showUploadModal - Whether the photo upload modal is visible.
   * @param {object|null} state.selectedTreasure - Treasure currently targeted by the upload modal.
   * @param {boolean} state.showAddModal - Whether the "Add Treasure" modal is visible.
   * @param {object} handlers - Page event handlers.
   * @param {Function} handlers.onCanEditChange - Called with the list's resolved edit permission.
   * @param {Function} handlers.onUploadClick - Called with a treasure when its upload button is clicked.
   * @param {Function} handlers.onUploadClose - Called when the upload modal is dismissed.
   * @param {Function} handlers.onUploadSuccess - Called after a successful photo upload.
   * @param {Function} handlers.onAddClick - Called when the "Add Treasure" button is clicked.
   * @param {Function} handlers.onAddClose - Called when the "Add Treasure" modal is dismissed.
   * @param {Function} handlers.onAddSuccess - Called after a successful treasure link.
   * @param {Function} handlers.onFilterQuery - Called with the built filter query object.
   * @param {Function} handlers.onFilterClear - Called when the filters are cleared.
   * @returns {React.ReactElement} Rendered treasures page.
   */
  static render(state, handlers) {
    return (
      <>
        <div className="container mt-4">
          <PageActions backHref={state.backHref}>
            {GameTreasuresHelper.#renderNewButton(state)}
            {GameTreasuresHelper.#renderAddButton(state, handlers)}
          </PageActions>
          <h1 className="mb-4">{Translator.t('game_treasures_page.treasures')}</h1>
        </div>
        <ListPage
          type="treasures"
          gameSlug={state.gameSlug}
          basePath={state.basePath}
          loadingMessage={Translator.t('game_treasures_page.loading')}
          context={{ onUploadClick: handlers.onUploadClick }}
          filtersProps={{
            onQuery: handlers.onFilterQuery, onClear: handlers.onFilterClear, showGameType: false,
          }}
          activeFilters={state.activeFilters}
          refreshToken={state.refreshToken}
          onCanEditChange={handlers.onCanEditChange}
        />
        <PhotoUploadModal
          show={state.showUploadModal}
          uploadPath={`/treasures/${state.selectedTreasure?.id}/photo_upload.json`}
          onClose={handlers.onUploadClose}
          onSuccess={handlers.onUploadSuccess}
        />
        <AddGameTreasureModal
          show={state.showAddModal}
          gameSlug={state.gameSlug}
          onClose={handlers.onAddClose}
          onSuccess={handlers.onAddSuccess}
        />
      </>
    );
  }

  static #renderNewButton(state) {
    if (!state.canEdit) {
      return null;
    }

    return (
      <NewButton href={state.newHref}>
        {Translator.t('game_treasures_page.new_treasure')}
      </NewButton>
    );
  }

  static #renderAddButton(state, handlers) {
    if (!state.canEdit) {
      return null;
    }

    return (
      <button type="button" className="btn btn-primary mb-3 ms-2" onClick={handlers.onAddClick}>
        {Translator.t('game_treasures_page.add_treasure')}
      </button>
    );
  }
}
