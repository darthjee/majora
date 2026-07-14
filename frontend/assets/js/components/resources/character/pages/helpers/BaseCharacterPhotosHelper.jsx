import React from 'react';
import PageActions from '../../../../common/PageActions.jsx';
import ErrorAlert from '../../../../common/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/LoadingMessage.jsx';
import Pagination from '../../../../common/Pagination.jsx';
import PhotoCard from '../../../../common/PhotoCard.jsx';
import UploadButton from '../../../../common/UploadButton.jsx';
import Translator from '../../../../../i18n/Translator.js';
import Icons from '../../../../../utils/ui/Icons.js';

/**
 * Shared rendering helper for the Character Photos (PC and NPC) listing page.
 *
 * @description Instantiated with an i18nNamespace to produce a type-specific
 *   photos-page helper (NPC or PC).
 */
export default class BaseCharacterPhotosHelper {
  /**
   * Create a character photos helper.
   *
   * @param {string} i18nNamespace - Translation namespace
   *   (e.g. 'npc_character_photos_page' or 'pc_character_photos_page').
   */
  constructor(i18nNamespace) {
    this.i18nNamespace = i18nNamespace;
  }

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
   * @param {boolean} canEdit - Whether the current user can upload photos and mark one
   *   of them as the character's profile photo.
   * @param {string} alt - Alt text applied to each photo image.
   * @param {number|null} profilePhotoId - Id of the character's current profile photo,
   *   or null/undefined when none is set.
   * @param {{onOpenUploadModal: Function, onSelectPhoto: Function, onSetProfilePhoto: Function}} handlers - Event
   *   handlers.
   * @returns {React.ReactElement} Photos list with pagination.
   */
  render(photos, pagination, basePath, backHref, canEdit, alt, profilePhotoId, handlers) {
    const { i18nNamespace } = this;

    return (
      <div className="container mt-4">
        <PageActions backHref={backHref}>
          {this.#renderUploadButton(canEdit, handlers)}
        </PageActions>
        <h1 className="mb-4">{Translator.t(`${i18nNamespace}.title`)}</h1>
        <div className="row">
          {photos.map((photo) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              alt={alt}
              onClick={handlers.onSelectPhoto}
              canSetProfilePhoto={canEdit}
              isProfilePhoto={photo.id === profilePhotoId}
              onSetProfilePhoto={handlers.onSetProfilePhoto}
            />
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
  renderLoading() {
    return <LoadingMessage message={Translator.t(`${this.i18nNamespace}.loading`)} />;
  }

  /**
   * Render the error state.
   *
   * @param {string} error - Error message.
   * @returns {React.ReactElement} Error alert.
   */
  renderError(error) {
    return <ErrorAlert error={error} />;
  }

  #renderUploadButton(canEdit, handlers) {
    if (!canEdit) return null;

    return (
      <UploadButton onClick={handlers.onOpenUploadModal} label={Translator.t(`${this.i18nNamespace}.upload`)}>
        <i className={`bi ${Icons.camera}`} aria-hidden="true"></i>
      </UploadButton>
    );
  }
}
