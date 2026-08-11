import React from 'react';
import BackButton from '../../../../common/buttons/BackButton.jsx';
import ActionsOverlay from '../../../../common/misc/ActionsOverlay.jsx';
import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the collection detail page.
 */
export default class CollectionHelper {
  /**
   * Render the collection detail view: a back button, the collection's picture (click-to-upload,
   * mirroring `SourceHelper`, when `isStaffOrSuperUser` is true) in the left column, then its
   * name, its `url` link (when present), its linked source (name, linking to the source's own
   * show page, when set), and its linked stl_models (a list, each linking to its own show page)
   * in the right column — every field `CollectionDetailSerializer` returns.
   *
   * @param {object} collection - Collection data object.
   * @param {number} collection.id - Collection id.
   * @param {string} collection.name - Collection name.
   * @param {string} [collection.url] - Collection website URL, or empty/undefined to skip the link.
   * @param {string|null} [collection.photo_url] - Collection photo URL, or null/undefined to fall
   *   back to the default placeholder image.
   * @param {{id: number, name: string}|null} [collection.source] - Linked source, or null when none.
   * @param {{id: number, name: string}[]} [collection.stl_models] - Linked STL models.
   * @param {boolean} isStaffOrSuperUser - Whether the current viewer may upload a new photo
   *   (resolved via `AccessStore.ensureStaffOrSuperUser()`, since `collections` has no per-item
   *   edit concept embedded in the payload).
   * @param {{onOpenUploadModal: Function}} handlers - Event handlers.
   * @returns {React.ReactElement} Collection detail element.
   */
  static render(collection, isStaffOrSuperUser, handlers) {
    return (
      <div className="container mt-4">
        <BackButton href="#/miniatures/collections" />
        <div className="row mt-3">
          <div className="col-md-4">
            <ActionsOverlay
              type="collection"
              url={collection.photo_url}
              alt={collection.name}
              canEdit={isStaffOrSuperUser}
              onClick={handlers.onOpenUploadModal}
            />
          </div>
          <div className="col-md-8">
            <h1>{collection.name}</h1>
            {CollectionHelper.#renderUrl(collection.url)}
            {CollectionHelper.#renderSource(collection.source)}
            {CollectionHelper.#renderStlModels(collection.stl_models)}
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
    return <LoadingMessage message={Translator.t('collection_page.loading')} />;
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
        <a href={url} target="_blank" rel="noreferrer">{Translator.t('collection_page.url')}</a>
      </div>
    );
  }

  static #renderSource(source) {
    if (!source) {
      return null;
    }

    return (
      <div className="mt-3">
        <span className="fw-bold">{Translator.t('collection_page.source_label')}</span>
        {' '}
        <a href={`#/miniatures/sources/${source.id}`}>{source.name}</a>
      </div>
    );
  }

  static #renderStlModels(stlModels) {
    if (!stlModels || stlModels.length === 0) {
      return null;
    }

    return (
      <div className="mt-3">
        <h2 className="h5">{Translator.t('collection_page.stl_models_title')}</h2>
        <ul>
          {stlModels.map((stlModel) => (
            <li key={stlModel.id}>
              <a href={`#/miniatures/stl_models/${stlModel.id}`}>{stlModel.name}</a>
            </li>
          ))}
        </ul>
      </div>
    );
  }
}
