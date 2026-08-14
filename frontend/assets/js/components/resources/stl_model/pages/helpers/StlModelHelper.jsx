import React from 'react';
import BackButton from '../../../../common/buttons/BackButton.jsx';
import ActionsOverlay from '../../../../common/misc/ActionsOverlay.jsx';
import Badge from '../../../../common/badges/Badge.jsx';
import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the STL model detail page.
 */
export default class StlModelHelper {
  /**
   * Render the STL model detail view: a back button, the model's picture (click-to-upload,
   * mirroring the PC/NPC detail pages, when `isStaffOrSuperUser` is true) and tags in the left
   * column, then its name (with an Edit link, when `isStaffOrSuperUser` is true),
   * owned/type/races/roles/url/size, links, sources, and collections in the right column —
   * every field `StlModelDetailSerializer` returns.
   *
   * @param {object} stlModel - STL model data object.
   * @param {number} stlModel.id - STL model id.
   * @param {string} stlModel.name - STL model name.
   * @param {string|null} [stlModel.photo_url] - STL model photo URL, or null/undefined to fall
   *   back to the default placeholder image.
   * @param {boolean} [stlModel.owned] - Whether this STL model is already owned.
   * @param {string} [stlModel.type] - STL model type (`terrain`/`prop`/`creature`/`other`).
   * @param {string|null} [stlModel.url] - External listing URL (e.g. MyMiniFactory/Thingiverse/
   *   Patreon), or null when unset.
   * @param {string|null} [stlModel.size] - STL model size, or null when unset.
   * @param {string[]} [stlModel.races] - STL model races, empty when unset.
   * @param {string[]} [stlModel.roles] - STL model roles, empty when unset.
   * @param {{id: number, text: string, url: string, link_type: string}[]} [stlModel.links] -
   *   External links for this STL model.
   * @param {{name: string}[]} [stlModel.sources] - Sources this STL model comes from.
   * @param {{name: string}[]} [stlModel.collections] - Collections this STL model belongs to.
   * @param {string[]} [stlModel.tags] - Tag names attached to this STL model.
   * @param {boolean} isStaffOrSuperUser - Whether the current viewer may upload a new photo and
   *   reach the edit page (resolved via `AccessStore.ensureStaffOrSuperUser()`, since
   *   `stl_models` has no per-item edit concept embedded in the payload).
   * @param {{onOpenUploadModal: Function}} handlers - Event handlers.
   * @returns {React.ReactElement} STL model detail element.
   */
  static render(stlModel, isStaffOrSuperUser, handlers) {
    return (
      <div className="container mt-4">
        <BackButton href="#/miniatures/stl_models" />
        <div className="row mt-3">
          <div className="col-md-4">
            <ActionsOverlay
              type="stl_model"
              url={stlModel.photo_url}
              alt={stlModel.name}
              canEdit={isStaffOrSuperUser}
              onClick={handlers.onOpenUploadModal}
            />
            {StlModelHelper.#renderTags(stlModel.tags)}
          </div>
          <div className="col-md-8">
            <div className="d-flex align-items-center">
              <h1 className="mb-0">{stlModel.name}</h1>
              {StlModelHelper.#renderEditLink(stlModel, isStaffOrSuperUser)}
            </div>
            {StlModelHelper.#renderOwned(stlModel)}
            {StlModelHelper.#renderEnumField('type', stlModel.type)}
            {StlModelHelper.#renderEnumArray('races', stlModel.races)}
            {StlModelHelper.#renderEnumArray('roles', stlModel.roles)}
            {StlModelHelper.#renderEnumField('size', stlModel.size)}
            {StlModelHelper.#renderUrl(stlModel.url)}
            {StlModelHelper.#renderLinks(stlModel.links)}
            {StlModelHelper.#renderSources(stlModel.sources)}
            {StlModelHelper.#renderCollections(stlModel.collections)}
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
    return <LoadingMessage message={Translator.t('stl_model_page.loading')} />;
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

  static #renderEditLink(stlModel, isStaffOrSuperUser) {
    if (!isStaffOrSuperUser) {
      return null;
    }

    return (
      <a
        href={`#/miniatures/stl_models/${stlModel.id}/edit`}
        className="btn btn-outline-secondary btn-sm ms-2"
      >
        {Translator.t('stl_model_page.edit')}
      </a>
    );
  }

  static #renderOwned(stlModel) {
    return (
      <p className="mt-2">
        <Badge
          text={Translator.t(stlModel.owned ? 'stl_model_page.owned_label' : 'stl_model_page.not_owned_label')}
          variant={stlModel.owned ? 'success' : 'secondary'}
        />
      </p>
    );
  }

  static #renderEnumField(field, value) {
    const displayValue = value
      ? Translator.t(`stl_model_page.${field}_${value}`)
      : Translator.t('stl_model_page.none_label');

    return (
      <p>
        <strong>{Translator.t(`stl_model_page.${field}_label`)}:</strong> {displayValue}
      </p>
    );
  }

  static #renderEnumArray(field, values) {
    if (!values || values.length === 0) {
      return null;
    }

    const singular = field.slice(0, -1);

    return (
      <div className="mt-3">
        <h5>{Translator.t(`stl_model_page.${field}_label`)}</h5>
        {values.map((value) => (
          <span key={value} className="me-1 d-inline-block">
            <Badge text={Translator.t(`stl_model_page.${singular}_${value}`)} />
          </span>
        ))}
      </div>
    );
  }

  static #renderUrl(url) {
    if (!url) {
      return null;
    }

    return (
      <p>
        <strong>{Translator.t('stl_model_page.url_label')}:</strong>{' '}
        <a href={url} target="_blank" rel="noreferrer">{url}</a>
      </p>
    );
  }

  static #renderLinks(links) {
    if (!links || links.length === 0) {
      return null;
    }

    return (
      <div className="mt-3">
        <h5>{Translator.t('stl_model_page.links')}</h5>
        <ul className="list-unstyled">
          {links.map((link) => (
            <li key={link.id}>
              <a href={link.url} target="_blank" rel="noreferrer">{link.text}</a>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  static #renderSources(sources) {
    if (!sources || sources.length === 0) {
      return null;
    }

    return (
      <div className="mt-3">
        <h5>{Translator.t('stl_model_page.sources')}</h5>
        <ul className="list-unstyled">
          {sources.map((source) => <li key={source.name}>{source.name}</li>)}
        </ul>
      </div>
    );
  }

  static #renderCollections(collections) {
    if (!collections || collections.length === 0) {
      return null;
    }

    return (
      <div className="mt-3">
        <h5>{Translator.t('stl_model_page.collections')}</h5>
        <ul className="list-unstyled">
          {collections.map((collection) => <li key={collection.name}>{collection.name}</li>)}
        </ul>
      </div>
    );
  }

  static #renderTags(tags) {
    if (!tags || tags.length === 0) {
      return null;
    }

    return (
      <div className="mt-3">
        <h5>{Translator.t('stl_model_page.tags')}</h5>
        {tags.map((tag) => (
          <span key={tag} className="me-1 d-inline-block">
            <Badge text={tag} />
          </span>
        ))}
      </div>
    );
  }
}
