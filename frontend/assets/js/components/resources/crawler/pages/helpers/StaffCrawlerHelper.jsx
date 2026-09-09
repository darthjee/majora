import React from 'react';
import Badge from '../../../../common/badges/Badge.jsx';
import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import PageActions from '../../../../common/list_page/PageActions.jsx';
import Translator from '../../../../../i18n/Translator.js';

// Fixed scroll height for the left-column feed, matching `DocumentPagesBoxHelper`'s own
// bordered, own-scroll box precedent.
const FEED_MAX_HEIGHT = 600;

/**
 * Rendering helper for the staff crawler debug page (issue #1274): a two-column layout, left
 * column a live feed of raw crawler emissions, right column the selected emission's full JSON
 * payload.
 */
export default class StaffCrawlerHelper {
  /**
   * Render the two-column layout.
   *
   * @param {object[]} emissions - Loaded emission records (`id`, `created_at`, `source`, `type`,
   *   `payload`), oldest-first.
   * @param {number|string|null} selectedId - Currently selected emission's id, or `null` when
   *   nothing is selected yet.
   * @param {Function} onSelect - Called with an emission's `id` when its feed row is clicked.
   * @param {{feedRef: object, onScroll: Function}} feedProps - Scroll container ref and scroll
   *   handler for the left column's feed, owned by `StaffCrawler`.
   * @returns {React.ReactElement} Staff crawler page element.
   */
  static render(emissions, selectedId, onSelect, feedProps) {
    const selected = emissions.find((emission) => emission.id === selectedId) ?? null;

    return (
      <div className="container-fluid mt-4">
        <PageActions backHref="#/" />
        <h1>{Translator.t('staff_crawler_page.title')}</h1>
        <div className="row">
          <div className="col-md-5">
            {StaffCrawlerHelper.#renderFeed(emissions, selectedId, onSelect, feedProps)}
          </div>
          <div className="col-md-7">
            {StaffCrawlerHelper.#renderDetail(selected)}
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
    return <LoadingMessage message={Translator.t('staff_crawler_page.loading')} />;
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

  static #renderFeed(emissions, selectedId, onSelect, { feedRef, onScroll }) {
    return (
      <div
        ref={feedRef}
        onScroll={onScroll}
        className="list-group border rounded p-2"
        style={{ maxHeight: FEED_MAX_HEIGHT, overflowY: 'auto' }}
      >
        {emissions.map((emission) => StaffCrawlerHelper.#renderRow(emission, selectedId, onSelect))}
      </div>
    );
  }

  static #renderRow(emission, selectedId, onSelect) {
    const isSelected = emission.id === selectedId;
    const classNames = ['list-group-item', 'list-group-item-action'];

    if (isSelected) {
      classNames.push('active');
    }

    return (
      <button
        key={emission.id}
        type="button"
        className={classNames.join(' ')}
        onClick={() => onSelect(emission.id)}
      >
        <div className="d-flex justify-content-between align-items-center">
          <span className="small">
            #
            {emission.id}
          </span>
          <span className="small">{new Date(emission.created_at).toLocaleString(Translator.getLanguage())}</span>
        </div>
        <div className="mt-1">
          <Badge text={emission.source} variant="secondary" />
          {' '}
          <Badge text={emission.type} variant="info" />
        </div>
      </button>
    );
  }

  static #renderDetail(selected) {
    if (!selected) {
      return <p className="text-muted">{Translator.t('staff_crawler_page.no_selection')}</p>;
    }

    return (
      <pre className="border rounded p-2" style={{ maxHeight: FEED_MAX_HEIGHT, overflowY: 'auto' }}>
        {JSON.stringify(selected, null, 2)}
      </pre>
    );
  }
}
