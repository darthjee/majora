import React from 'react';
import BackButton from '../../../../common/buttons/BackButton.jsx';
import CardPhoto from '../../../../common/cards/CardPhoto.jsx';
import Badge from '../../../../common/badges/Badge.jsx';
import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the STL model detail page.
 */
export default class StlModelHelper {
  /**
   * Render the STL model detail view: a back button, the model's name and picture, then its
   * links, sources, and tags — every field `StlModelDetailSerializer` returns.
   *
   * @param {object} stlModel - STL model data object.
   * @param {number} stlModel.id - STL model id.
   * @param {string} stlModel.name - STL model name.
   * @param {string|null} [stlModel.photo_url] - STL model photo URL, or null/undefined to fall
   *   back to the default placeholder image.
   * @param {{id: number, text: string, url: string, link_type: string}[]} [stlModel.links] -
   *   External links for this STL model.
   * @param {{name: string}[]} [stlModel.sources] - Sources this STL model comes from.
   * @param {string[]} [stlModel.tags] - Tag names attached to this STL model.
   * @returns {React.ReactElement} STL model detail element.
   */
  static render(stlModel) {
    return (
      <div className="container mt-4">
        <BackButton href="#/stl_models" />
        <div className="row mt-3">
          <div className="col-md-4">
            <CardPhoto url={stlModel.photo_url} alt={stlModel.name} />
          </div>
          <div className="col-md-8">
            <h1>{stlModel.name}</h1>
            {StlModelHelper.#renderLinks(stlModel.links)}
            {StlModelHelper.#renderSources(stlModel.sources)}
            {StlModelHelper.#renderTags(stlModel.tags)}
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
