import React from 'react';
import { MAX_PREVIEW_TREASURES } from '../characterPreviewConstants.js';
import Translator from '../../../i18n/Translator.js';

/**
 * Rendering helper for the TreasurePreviewSection element.
 */
export default class TreasurePreviewSectionHelper {
  /**
   * Render a preview section with a heading, a short list of treasure rows
   * (name and quantity), and a "See all" link.
   *
   * @param {object[]} treasures - List of treasure objects (`id`, `name`, `quantity`).
   * @param {string} title - Section heading.
   * @param {string} seeAllHref - Hash href for the "See all" link.
   * @returns {React.ReactElement} Treasure preview section element.
   */
  static render(treasures, title, seeAllHref) {
    const preview = treasures.slice(0, MAX_PREVIEW_TREASURES);

    return (
      <div className="mt-4">
        <h2>{title}</h2>
        <ul className="list-group mb-2">
          {preview.map((treasure) => (
            <li key={treasure.id} className="list-group-item d-flex justify-content-between align-items-center">
              <span>{treasure.name}</span>
              <span className="text-muted">{treasure.quantity}</span>
            </li>
          ))}
        </ul>
        <a href={seeAllHref}>{Translator.t('character_preview_section.see_all').replace('{{title}}', title)}</a>
      </div>
    );
  }
}
