import React from 'react';
import PageActions from '../../elements/PageActions.jsx';
import ErrorAlert from '../../elements/ErrorAlert.jsx';
import LoadingMessage from '../../elements/LoadingMessage.jsx';
import Pagination from '../../elements/Pagination.jsx';
import PhotoCard from '../../elements/PhotoCard.jsx';
import Translator from '../../../i18n/Translator.js';

/**
 * Rendering helper for the NPC Character Photos listing page.
 */
export default class NpcCharacterPhotosHelper {
  /**
   * Render the photos grid with pagination, an upload button, and a back button.
   *
   * @param {object[]} photos - List of photo objects.
   * @param {object} pagination - Pagination metadata.
   * @param {number} pagination.page - Current page.
   * @param {number} pagination.pages - Total pages.
   * @param {number} pagination.perPage - Items per page.
   * @param {string} basePath - Base hash path used for pagination links.
   * @param {string} backHref - Hash path to the parent character page.
   * @param {boolean} canEdit - Whether the current user can upload photos.
   * @param {string} alt - Alt text applied to each photo image.
   * @param {{onOpenUploadModal: Function, onSelectPhoto: Function}} handlers - Event handlers.
   * @returns {React.ReactElement} Photos list with pagination.
   */
  static render(photos, pagination, basePath, backHref, canEdit, alt, handlers) {
    return (
      <div className="container mt-4">
        <PageActions backHref={backHref}>
          {NpcCharacterPhotosHelper.#renderUploadButton(canEdit, handlers)}
        </PageActions>
        <h1 className="mb-4">{Translator.t('photos_page.title')}</h1>
        <div className="row">
          {photos.map((photo) => (
            <PhotoCard key={photo.id} photo={photo} alt={alt} onClick={handlers.onSelectPhoto} />
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
    return <LoadingMessage message={Translator.t('photos_page.loading')} />;
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

  /**
   * Render the upload button, shown only when the current user can edit.
   *
   * @param {boolean} canEdit - Whether the current user can upload photos.
   * @param {{onOpenUploadModal: Function}} handlers - Event handlers.
   * @returns {React.ReactElement|null} Upload button, or null.
   */
  static #renderUploadButton(canEdit, handlers) {
    if (!canEdit) return null;

    return (
      <button type="button" className="btn btn-secondary" onClick={handlers.onOpenUploadModal}>
        {Translator.t('photos_page.upload')}
      </button>
    );
  }
}
