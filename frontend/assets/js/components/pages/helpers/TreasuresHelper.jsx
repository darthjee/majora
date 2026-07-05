import React from 'react';
import ErrorAlert from '../../elements/ErrorAlert.jsx';
import LoadingMessage from '../../elements/LoadingMessage.jsx';
import NewButton from '../../elements/NewButton.jsx';
import PageActions from '../../elements/PageActions.jsx';
import Pagination from '../../elements/Pagination.jsx';
import TreasureCard from '../../elements/TreasureCard.jsx';
import Translator from '../../../i18n/Translator.js';
import Noop from '../../../utils/Noop.js';

/**
 * Rendering helper for the Treasures listing page.
 */
export default class TreasuresHelper {
  /**
   * Render the treasures list with pagination.
   *
   * @param {object[]} treasures - List of treasure objects.
   * @param {object} pagination - Pagination metadata.
   * @param {number} pagination.page - Current page.
   * @param {number} pagination.pages - Total pages.
   * @param {number} pagination.perPage - Items per page.
   * @param {boolean} [isSuperUser] - Whether the current user may upload treasure photos.
   * @param {Function} [onUploadClick] - Handler invoked with a treasure when its upload button is clicked.
   * @returns {React.ReactElement} Treasures list with pagination.
   */
  static render(treasures, pagination, isSuperUser = false, onUploadClick = Noop.noop) {
    return (
      <div className="container mt-4">
        <PageActions backHref="#/">
          <NewButton href="#/treasures/new">
            {Translator.t('treasures_page.new_treasure')}
          </NewButton>
        </PageActions>
        <div className="row">
          {treasures.map((treasure) => (
            <TreasureCard
              key={treasure.id}
              treasure={treasure}
              canManage={isSuperUser}
              onUploadClick={onUploadClick}
            />
          ))}
        </div>
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          perPage={pagination.perPage}
          basePath="#/treasures"
        />
      </div>
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

  /**
   * Render the error state.
   *
   * @param {string} error - Error message.
   * @returns {React.ReactElement} Error alert.
   */
  static renderError(error) {
    return <ErrorAlert error={error} />;
  }
}
