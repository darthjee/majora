import React from 'react';
import BackButton from '../../elements/BackButton.jsx';
import ErrorAlert from '../../elements/ErrorAlert.jsx';
import LoadingMessage from '../../elements/LoadingMessage.jsx';
import Pagination from '../../elements/Pagination.jsx';
import TreasureCard from '../../elements/TreasureCard.jsx';
import Translator from '../../../i18n/Translator.js';

/**
 * Rendering helper for the Game Treasures listing page.
 */
export default class GameTreasuresHelper {
  /**
   * Render the treasures list with pagination and a back button.
   *
   * @param {object[]} treasures - List of treasure objects.
   * @param {object} pagination - Pagination metadata.
   * @param {number} pagination.page - Current page.
   * @param {number} pagination.pages - Total pages.
   * @param {number} pagination.perPage - Items per page.
   * @param {string} basePath - Base hash path used for pagination links.
   * @param {string} backHref - Hash path to the parent game page.
   * @returns {React.ReactElement} Treasures list with pagination.
   */
  static render(treasures, pagination, basePath, backHref) {
    return (
      <div className="container mt-4">
        <BackButton href={backHref} />
        <h1 className="mb-4">{Translator.t('game_treasures_page.treasures')}</h1>
        <div className="row">
          {treasures.map((treasure) => (
            <TreasureCard key={treasure.id} treasure={treasure} />
          ))}
        </div>
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          perPage={pagination.perPage}
          basePath={basePath}
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
    return <LoadingMessage message={Translator.t('game_treasures_page.loading')} />;
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
