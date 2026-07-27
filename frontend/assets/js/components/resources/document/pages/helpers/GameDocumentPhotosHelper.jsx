import React from 'react';
import PageActions from '../../../../common/list_page/PageActions.jsx';
import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import Pagination from '../../../../common/pagination/Pagination.jsx';
import PhotoCard from '../../../../common/cards/PhotoCard.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the game document photos index page (issue #873), mirroring
 * `BaseCharacterPhotosHelper`, but simpler: no upload button, no profile-photo affordance —
 * there is no "profile photo" concept for a `GameDocument`.
 */
export default class GameDocumentPhotosHelper {
  /**
   * Render the photos grid with pagination and a back button.
   *
   * @param {object[]} photos - List of photo objects (`id`, `path`).
   * @param {object} pagination - Pagination metadata.
   * @param {number} pagination.page - Current page.
   * @param {number} pagination.pages - Total pages.
   * @param {number} pagination.perPage - Items per page.
   * @param {string} basePath - Base hash path used for pagination links.
   * @param {string} backHref - Hash path to the document detail page.
   * @param {Function} onSelectPhoto - Handler invoked with the photo when a card is clicked.
   * @returns {React.ReactElement} Photos list with pagination.
   */
  static render(photos, pagination, basePath, backHref, onSelectPhoto) {
    return (
      <div className="container mt-4">
        <PageActions backHref={backHref} />
        <h1 className="mb-4">{Translator.t('game_document_photos_page.title')}</h1>
        <div className="row">
          {photos.map((photo) => (
            <PhotoCard key={photo.id} photo={photo} alt="" onClick={onSelectPhoto} />
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
    return <LoadingMessage message={Translator.t('game_document_photos_page.loading')} />;
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
