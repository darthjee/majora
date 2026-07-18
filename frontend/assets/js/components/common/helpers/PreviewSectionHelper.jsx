import React from 'react';
import SeeAllCard from '../SeeAllCard.jsx';
import Translator from '../../../i18n/Translator.js';

/**
 * Rendering helper for the PreviewSection element.
 */
export default class PreviewSectionHelper {
  /**
   * Render a preview section with a heading, an optional empty-state message,
   * a row of item cards (sliced to `maxItems`), and a "See all" card.
   *
   * @param {object[]} items - List of items to preview.
   * @param {string} title - Section heading.
   * @param {string} seeAllHref - Hash href for the "See all" card.
   * @param {string} icon - Bootstrap icon class name (see `Icons.js`) for the "See all" card.
   * @param {number} maxItems - Maximum number of items shown before the "See all" card.
   * @param {Function} renderItem - Function `(item) => ReactElement` called for each sliced item.
   * @param {string} [emptyText] - Muted paragraph shown above the row when `items` is empty.
   * @returns {React.ReactElement} Preview section element.
   */
  static render(items, title, seeAllHref, icon, maxItems, renderItem, emptyText) {
    const preview = items.slice(0, maxItems);
    const seeAllText = Translator.t('character_preview_section.see_all').replace('{{title}}', title);

    return (
      <div className="mt-4">
        <h2>{title}</h2>
        {PreviewSectionHelper.#renderEmptyText(preview, emptyText)}
        <div className="row">
          {preview.map(renderItem)}
          <SeeAllCard icon={icon} text={seeAllText} href={seeAllHref} />
        </div>
      </div>
    );
  }

  static #renderEmptyText(preview, emptyText) {
    if (preview.length > 0 || !emptyText) {
      return null;
    }

    return <p className="text-muted">{emptyText}</p>;
  }
}
