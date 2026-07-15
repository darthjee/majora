import React from 'react';
import TreasureCard from '../../../../../common/TreasureCard.jsx';
import SeeAllCard from '../../../../../common/SeeAllCard.jsx';
import { MAX_PREVIEW_TREASURES } from '../../../../../common/characterPreviewConstants.js';
import Translator from '../../../../../../i18n/Translator.js';
import Icons from '../../../../../../utils/ui/Icons.js';

/**
 * Rendering helper for the CharacterTreasuresPreview element.
 */
export default class CharacterTreasuresPreviewHelper {
  /**
   * Render a preview section with a heading and a card grid of the first few
   * owned treasures (reusing TreasureCard, mapped onto the underlying
   * treasure's id/photo so the card's link and image resolve correctly),
   * ending with a "See all" card.
   *
   * @param {object[]} treasures - List of owned treasure objects (`id`, `treasure_id`,
   *   `name`, `quantity`, `value`, `photo_path`).
   * @param {string} title - Section heading.
   * @param {string} seeAllHref - Hash href for the "See all" card.
   * @param {string} [gameType] - Currency model name (e.g. `dnd`, `deadlands`) of the
   *   character's own game, used to render each previewed treasure's value. Defaults to `dnd`.
   * @returns {React.ReactElement} Character treasures preview section element.
   */
  static render(treasures, title, seeAllHref, gameType = 'dnd') {
    const preview = treasures.slice(0, MAX_PREVIEW_TREASURES);

    return (
      <div className="mt-4">
        <h2>{title}</h2>
        {CharacterTreasuresPreviewHelper.#renderBody(preview, gameType, title, seeAllHref)}
      </div>
    );
  }

  static #renderBody(preview, gameType, title, seeAllHref) {
    const seeAllText = Translator.t('character_preview_section.see_all').replace('{{title}}', title);

    if (preview.length === 0) {
      return (
        <>
          <p className="text-muted">{Translator.t('character_treasures_preview.empty')}</p>
          <div className="row">
            <SeeAllCard icon={Icons.gem} text={seeAllText} href={seeAllHref} />
          </div>
        </>
      );
    }

    return (
      <div className="row">
        {preview.map((treasure) => (
          <TreasureCard
            key={treasure.id}
            treasure={{
              id: treasure.treasure_id,
              name: treasure.name,
              value: treasure.value,
              photo_path: treasure.photo_path,
              game_type: gameType,
            }}
            quantity={treasure.quantity}
          />
        ))}
        <SeeAllCard icon={Icons.gem} text={seeAllText} href={seeAllHref} />
      </div>
    );
  }
}
