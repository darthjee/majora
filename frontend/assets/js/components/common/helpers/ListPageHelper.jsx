import React from 'react';
import ActionsOverlay from '../ActionsOverlay.jsx';
import Pagination from '../Pagination.jsx';
import ErrorAlert from '../ErrorAlert.jsx';
import LoadingMessage from '../LoadingMessage.jsx';
import listTypeConfig from '../listTypes/listTypeConfig.js';

/**
 * Rendering helper for the shared `ListPage` component.
 */
export default class ListPageHelper {
  /**
   * Render the list's filters (if any), item grid, and pagination.
   *
   * @param {string} type - List type, a key into `listTypeConfig`.
   * @param {object[]} items - Raw list entries fetched for the current page.
   * @param {object} pagination - Pagination metadata.
   * @param {number} pagination.page - Current page.
   * @param {number} pagination.pages - Total pages.
   * @param {number} pagination.perPage - Items per page.
   * @param {string} basePath - Base hash path used for pagination links.
   * @param {object} context - Rendering context passed through to the type's
   *   `buildActionBarProps`/`buildInfoBarItems`/`buildItemHref`.
   * @param {object} [filtersProps] - Extra props merged into the type's `filtersComponent`.
   * @param {object|URLSearchParams} [activeFilters] - Active query params preserved on every
   *   pagination link.
   * @returns {React.ReactElement} Rendered list page body.
   */
  static render(type, items, pagination, basePath, context, filtersProps = {}, activeFilters = {}) {
    const config = listTypeConfig[type];
    const Filters = config.filtersComponent;

    return (
      <div className="container mt-4">
        {Filters && <Filters {...filtersProps} />}
        <div className="row">
          {items.map((rawItem) => ListPageHelper.#renderItem(rawItem, config, context))}
        </div>
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          perPage={pagination.perPage}
          basePath={basePath}
          extraParams={activeFilters}
        />
      </div>
    );
  }

  /**
   * Render the loading state.
   *
   * @param {string} message - Loading message to display.
   * @returns {React.ReactElement} Loading message element.
   */
  static renderLoading(message) {
    return <LoadingMessage message={message} />;
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

  static #renderItem(rawItem, config, context) {
    const item = new config.wrapperClass(rawItem);
    const href = config.buildItemHref(item, context);

    return (
      <div className="col-6 col-sm-4 col-md-3 col-lg-2 mb-4" key={rawItem.id}>
        <div className="card h-100 position-relative">
          <ActionsOverlay
            type={config.photoType}
            url={item.photoUrl}
            alt={item.displayText}
            infoBarItems={config.buildInfoBarItems(item, context)}
            {...config.buildActionBarProps(item, context)}
          />
          {ListPageHelper.#renderCaption(item, href, config.showCaption)}
        </div>
      </div>
    );
  }

  static #renderCaption(item, href, showCaption) {
    if (!showCaption) {
      return null;
    }

    return (
      <div className="card-body">
        <h6 className="card-title">
          <a href={href} className="stretched-link text-decoration-none text-dark">
            {item.displayText}
          </a>
        </h6>
        {item.formattedValue && <p className="card-text text-muted mb-0">{item.formattedValue}</p>}
        {item.availabilityText && (
          <p className="card-text text-muted small mb-0">{item.availabilityText}</p>
        )}
      </div>
    );
  }
}
