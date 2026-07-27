import React from 'react';
import PageActions from '../../../../common/list_page/PageActions.jsx';
import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import Pagination from '../../../../common/pagination/Pagination.jsx';
import DocumentFileCard from '../../../../common/cards/DocumentFileCard.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the game document files index page (issue #873), mirroring
 * `GameDocumentPhotosHelper`, but rendering a grid of `DocumentFileCard`s (which download the
 * file on click) instead of a photo grid.
 */
export default class GameDocumentFilesHelper {
  /**
   * Render the files grid with pagination and a back button.
   *
   * @param {object[]} files - List of `GameDocumentFile` objects (`id`, `name`, `path`,
   *   `photo_path`).
   * @param {object} pagination - Pagination metadata.
   * @param {number} pagination.page - Current page.
   * @param {number} pagination.pages - Total pages.
   * @param {number} pagination.perPage - Items per page.
   * @param {string} basePath - Base hash path used for pagination links.
   * @param {string} backHref - Hash path to the document detail page.
   * @returns {React.ReactElement} Files list with pagination.
   */
  static render(files, pagination, basePath, backHref) {
    return (
      <div className="container mt-4">
        <PageActions backHref={backHref} />
        <h1 className="mb-4">{Translator.t('game_document_files_page.title')}</h1>
        <div className="row">
          {files.map((file) => <DocumentFileCard key={file.id} file={file} />)}
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
    return <LoadingMessage message={Translator.t('game_document_files_page.loading')} />;
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
