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
          {items.map((rawItem) => ListPageHelper.#renderItem(rawItem, config, context, items.length))}
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

  static #renderItem(rawItem, config, context, itemsCount) {
    const item = new config.wrapperClass(rawItem);
    const href = config.buildItemHref(item, context);
    const extraCardClassName = config.buildCardClassName ? config.buildCardClassName(item) : '';
    const cardClassName = `card h-100 position-relative${extraCardClassName ? ` ${extraCardClassName}` : ''}`;
    const columnClassName = `${ListPageHelper.#columnClassName(config.itemsPerRow, itemsCount, config.flexibleColumns)} mb-4`;
    const { secondaryButtons, ...actionBarProps } = config.buildActionBarProps(item, context);

    return (
      <div className={columnClassName} key={rawItem.id}>
        <div className={cardClassName}>
          <ActionsOverlay
            type={config.photoType}
            url={item.photoUrl}
            alt={item.displayText}
            photoClassName={config.cardPhotoClassName}
            overlayItems={{ infoBarItems: config.buildInfoBarItems(item, context), secondaryButtons }}
            {...actionBarProps}
          />
          {ListPageHelper.#renderCaption(item, href, config.showCaption)}
        </div>
      </div>
    );
  }

  /**
   * Build the outer card column's Bootstrap width classes for every breakpoint, so the grid
   * fills the row edge-to-edge instead of leaving a gap when fewer items than a breakpoint's
   * normal column count are being rendered.
   *
   * @param {number} [itemsPerRow] - Number of cards per row at the `lg` breakpoint, from the
   *   active list type's config; defaults to `6` when omitted.
   * @param {number} itemsCount - Number of items actually being rendered on the current page.
   * @param {boolean} [flexibleColumns] - Whether the active list type opts into the flexible
   *   edge-to-edge grid (capping each breakpoint's column count to `itemsCount`); falsy keeps
   *   the fixed column count regardless of `itemsCount`.
   * @returns {string} Space-separated `col-*`/`col-sm-*`/`col-md-*`/`col-lg-*` classes.
   */
  static #columnClassName(itemsPerRow, itemsCount, flexibleColumns) {
    return ListPageHelper.#breakpoints(itemsPerRow)
      .map(({ prefix, normal }) => (
        ListPageHelper.#breakpointColumnClass(prefix, normal, itemsCount, flexibleColumns)
      ))
      .join(' ');
  }

  /**
   * List the grid's breakpoints and each one's "normal" (unconstrained) column count.
   *
   * @param {number} [itemsPerRow] - Number of cards per row at the `lg` breakpoint, from the
   *   active list type's config; defaults to `6` when omitted.
   * @returns {{prefix: string, normal: number}[]} Breakpoint prefixes (empty for `xs`) paired
   *   with their normal column count.
   */
  static #breakpoints(itemsPerRow) {
    return [
      { prefix: '', normal: 2 },
      { prefix: 'sm', normal: 3 },
      { prefix: 'md', normal: 4 },
      { prefix: 'lg', normal: itemsPerRow || 6 },
    ];
  }

  /**
   * Build a single breakpoint's Bootstrap width class, capping its normal column count to the
   * number of items actually being rendered.
   *
   * @param {string} prefix - Breakpoint prefix (`''`, `'sm'`, `'md'`, or `'lg'`).
   * @param {number} normal - The breakpoint's normal (unconstrained) column count.
   * @param {number} itemsCount - Number of items actually being rendered on the current page.
   * @param {boolean} [flexibleColumns] - Whether to cap `normal` to `itemsCount`; falsy keeps
   *   `normal` as-is (fixed column count, pre-PR-#1211 behavior).
   * @returns {string} Bootstrap `col-*`/`col-{prefix}-*` class for the given breakpoint.
   */
  static #breakpointColumnClass(prefix, normal, itemsCount, flexibleColumns) {
    const effectiveColumns = flexibleColumns ? Math.min(normal, itemsCount) : normal;
    const width = 12 / effectiveColumns;
    return prefix ? `col-${prefix}-${width}` : `col-${width}`;
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
