import React from 'react';
import ActionsOverlay from '../../misc/ActionsOverlay.jsx';
import Pagination from '../../pagination/Pagination.jsx';
import ErrorAlert from '../../misc/ErrorAlert.jsx';
import LoadingMessage from '../../misc/LoadingMessage.jsx';
import listTypeConfig from '../../list_types/listTypeConfig.js';

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
    const extraCardClassName = config.buildCardClassName ? config.buildCardClassName(item) : '';
    const cardClassName = `card h-100 position-relative${extraCardClassName ? ` ${extraCardClassName}` : ''}`;

    return (
      <div className="col-6 col-sm-4 col-md-3 col-lg-2 mb-4" key={rawItem.id}>
        <div className={cardClassName}>
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
          {ListPageHelper.#renderTitleLink(item, href)}
        </h6>
        {item.formattedValue && <p className="card-text text-muted mb-0">{item.formattedValue}</p>}
        {item.availabilityText && (
          <p className="card-text text-muted small mb-0">{item.availabilityText}</p>
        )}
      </div>
    );
  }

  /**
   * Render the caption title, as a stretched clickable link when `href` is given, or as
   * plain text otherwise — some list types (e.g. items, which have no standalone detail
   * page in scope) have nothing to link the caption to.
   *
   * @param {import('../../list_types/BaseListItem.js').default} item - Wrapped list item.
   * @param {string|null} href - Click-through href built by the type's `buildItemHref`, or
   *   `null` when the type has no detail page to link to.
   * @returns {React.ReactElement} Title link or plain text element.
   */
  static #renderTitleLink(item, href) {
    if (!href) {
      return <span className="text-dark">{item.displayText}</span>;
    }

    return (
      <a href={href} className="stretched-link text-decoration-none text-dark">
        {item.displayText}
      </a>
    );
  }
}
