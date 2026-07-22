import React from 'react';
import PreviewSection from '../../../../../common/cards/PreviewSection.jsx';
import CharacterPreviewCard from '../../../../../common/cards/CharacterPreviewCard.jsx';
import { PREVIEW_LIST_TYPES } from '../../../../../common/cards/characterPreviewConstants.js';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Render a single character-type preview section (PCs or NPCs).
 *
 * @param {'pc'|'npc'} characterType - Character type this section previews.
 * @param {object[]} items - Preview list items.
 * @param {string} gameSlug - Game slug, used to build cards and the "See all" link.
 * @returns {React.ReactElement} Preview section element.
 */
function renderSection(characterType, items, gameSlug) {
  const listType = PREVIEW_LIST_TYPES[characterType];

  return (
    <PreviewSection
      items={items}
      title={Translator.t(listType.titleKey)}
      seeAllHref={`#/games/${gameSlug}/${characterType}s`}
      icon={listType.icon}
      renderItem={(character) => (
        <CharacterPreviewCard
          key={character.id}
          character={character}
          gameSlug={gameSlug}
          characterType={characterType}
        />
      )}
    />
  );
}

/**
 * Show-mode right-column slot: the game's PC and NPC preview sections.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {string} context.game_slug - Game slug.
 * @param {object[]} [context.pcs] - PCs preview list.
 * @param {object[]} [context.npcs] - NPCs preview list.
 * @returns {React.ReactElement} The PC and NPC preview sections.
 */
export default function GamePreviewSections({ game_slug: gameSlug, pcs = [], npcs = [] }) {
  return (
    <>
      {renderSection('pc', pcs, gameSlug)}
      {renderSection('npc', npcs, gameSlug)}
    </>
  );
}
