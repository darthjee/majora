import React from 'react';
import BackButton from '../../../../common/buttons/BackButton.jsx';
import ActionsOverlay from '../../../../common/misc/ActionsOverlay.jsx';
import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the source detail page.
 */
export default class SourceHelper {
  /**
   * Render the source detail view: a back button, the source's picture (click-to-upload,
   * mirroring `StlModelHelper`, when `isStaffOrSuperUser` is true) in the left column, then its
   * name and, when present, a link to its `url` in the right column — every field
   * `SourceDetailSerializer` returns.
   *
   * @param {object} source - Source data object.
   * @param {number} source.id - Source id.
   * @param {string} source.name - Source name.
   * @param {string} [source.url] - Source website URL, or empty/undefined to skip the link.
   * @param {string|null} [source.photo_url] - Source photo URL, or null/undefined to fall back
   *   to the default placeholder image.
   * @param {boolean} isStaffOrSuperUser - Whether the current viewer may upload a new photo
   *   (resolved via `AccessStore.ensureStaffOrSuperUser()`, since `sources` has no per-item
   *   edit concept embedded in the payload).
   * @param {{onOpenUploadModal: Function}} handlers - Event handlers.
   * @returns {React.ReactElement} Source detail element.
   */
  static render(source, isStaffOrSuperUser, handlers) {
    return (
      <div className="container mt-4">
        <BackButton href="#/miniatures/sources" />
        <div className="row mt-3">
          <div className="col-md-4">
            <ActionsOverlay
              type="source"
              url={source.photo_url}
              alt={source.name}
              canEdit={isStaffOrSuperUser}
              onClick={handlers.onOpenUploadModal}
            />
          </div>
          <div className="col-md-8">
            <h1>{source.name}</h1>
            {SourceHelper.#renderUrl(source.url)}
          </div>
        </div>
      </div>
    );
  }

  /**
   * Render the loading state.
   *
   * @returns {React.ReactElement} Loading message.
   */
  static renderLoading() {
    return <LoadingMessage message={Translator.t('source_page.loading')} />;
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

  static #renderUrl(url) {
    if (!url) {
      return null;
    }

    return (
      <div className="mt-3">
        <a href={url} target="_blank" rel="noreferrer">{Translator.t('source_page.url')}</a>
      </div>
    );
  }
}
