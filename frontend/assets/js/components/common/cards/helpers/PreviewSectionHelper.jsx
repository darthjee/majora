import React from 'react';
import SeeAllCard from '../SeeAllCard.jsx';
import Translator from '../../../../i18n/Translator.js';
import Icons from '../../../../utils/ui/Icons.js';

/**
 * Rendering helper for the PreviewSection element.
 */
export default class PreviewSectionHelper {
  /**
   * Render a collapsible preview section: a clickable heading showing the item count (or a
   * "loading" placeholder while the fetch is in flight), and, only while expanded, an optional
   * empty-state message, a row of item cards (sliced to `maxItems`), and a "See all" card.
   *
   * @param {object[]} items - List of items to preview.
   * @param {string} title - Section heading.
   * @param {object} seeAllCard - Data for the "See all" card.
   * @param {string} seeAllCard.href - Hash href for the "See all" card.
   * @param {string} seeAllCard.icon - Bootstrap icon class name (see `Icons.js`) for the "See
   *   all" card.
   * @param {number} maxItems - Maximum number of items shown before the "See all" card.
   * @param {Function} renderItem - Function `(item) => ReactElement` called for each sliced item.
   * @param {string} [emptyText] - Muted paragraph shown above the row when `items` is empty.
   * @param {object} sectionState - State driving the section's collapse behavior.
   * @param {boolean} sectionState.loading - Whether the caller's fetch is still in flight.
   * @param {number} sectionState.total - Total item count (from pagination metadata), shown in
   *   the title.
   * @param {boolean} sectionState.collapsed - Whether the section body is currently hidden.
   * @param {Function} onToggle - Click handler for the heading, toggling `collapsed`.
   * @returns {React.ReactElement} Preview section element.
   */
  static render(items, title, seeAllCard, maxItems, renderItem, emptyText, sectionState, onToggle) {
    const { href: seeAllHref, icon } = seeAllCard;
    const { loading, total, collapsed } = sectionState;
    const preview = items.slice(0, maxItems);
    const seeAllText = Translator.t('character_preview_section.see_all').replace('{{title}}', title);
    const countText = loading ? 'loading' : total;

    return (
      <div className="mt-4">
        {PreviewSectionHelper.#renderHeading(title, countText, collapsed, onToggle)}
        {!collapsed && PreviewSectionHelper.#renderBody(preview, emptyText, renderItem, icon, seeAllText, seeAllHref)}
      </div>
    );
  }

  static #renderHeading(title, countText, collapsed, onToggle) {
    const icon = collapsed ? Icons.caretDownSquareFill : Icons.caretUpSquareFill;

    return (
      <h2>
        <button
          type="button"
          className="btn btn-link p-0 text-decoration-none"
          aria-expanded={!collapsed}
          onClick={onToggle}
        >
          <i className={`bi ${icon} me-2`} aria-hidden="true"></i>
          {`${title} (${countText})`}
        </button>
      </h2>
    );
  }

  static #renderBody(preview, emptyText, renderItem, icon, seeAllText, seeAllHref) {
    return (
      <>
        {PreviewSectionHelper.#renderEmptyText(preview, emptyText)}
        <div className="row">
          {preview.map(renderItem)}
          <SeeAllCard icon={icon} text={seeAllText} href={seeAllHref} />
        </div>
      </>
    );
  }

  static #renderEmptyText(preview, emptyText) {
    if (preview.length > 0 || !emptyText) {
      return null;
    }

    return <p className="text-muted">{emptyText}</p>;
  }
}
