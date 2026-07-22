import React from 'react';
import PreviewSection from '../../../../../common/cards/PreviewSection.jsx';
import TreasurePreviewCard from '../../../../../common/cards/TreasurePreviewCard.jsx';
import ItemPreviewCard from '../../../../../common/cards/ItemPreviewCard.jsx';
import DocumentPreviewCard from '../../../../../common/cards/DocumentPreviewCard.jsx';
import { PREVIEW_LIST_TYPES } from '../../../../../common/cards/characterPreviewConstants.js';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Show-mode right-column slot: the character's treasures, items, and documents preview
 * sections, identical for PCs and NPCs, matching `CharacterHelper#render`'s existing sections.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {string} context.game_slug - Game slug, used to build the "See all" hrefs.
 * @param {number|string} context.id - Character id, used to build the "See all" hrefs.
 * @param {boolean} [context.is_pc] - Whether the character is a PC, used to pick the URL segment.
 * @param {string} [context.game_type] - Currency model name, threaded into each treasure card.
 * @param {object[]} [context.treasures] - Preview list of the character's treasures.
 * @param {object[]} [context.items] - Preview list of the character's items.
 * @param {object[]} [context.documents] - Preview list of the character's documents.
 * @returns {React.ReactElement} The treasures, items, and documents preview sections.
 */
export default function CharacterPreviewSectionsSlot({
  game_slug: gameSlug, id, is_pc: isPc, game_type: gameType,
  treasures = [], items = [], documents = [],
}) {
  const segment = isPc ? 'pcs' : 'npcs';

  return (
    <>
      <PreviewSection
        items={treasures}
        title={Translator.t(PREVIEW_LIST_TYPES.treasure.titleKey)}
        seeAllHref={`#/games/${gameSlug}/${segment}/${id}/treasures`}
        icon={PREVIEW_LIST_TYPES.treasure.icon}
        emptyText={Translator.t('character_treasures_preview.empty')}
        renderItem={(treasure) => (
          <TreasurePreviewCard
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
        )}
      />
      <PreviewSection
        items={items}
        title={Translator.t(PREVIEW_LIST_TYPES.item.titleKey)}
        seeAllHref={`#/games/${gameSlug}/${segment}/${id}/items`}
        icon={PREVIEW_LIST_TYPES.item.icon}
        emptyText={Translator.t('character_items_preview.empty')}
        renderItem={(item) => <ItemPreviewCard key={item.id} item={item} />}
      />
      <PreviewSection
        items={documents}
        title={Translator.t(PREVIEW_LIST_TYPES.document.titleKey)}
        seeAllHref={`#/games/${gameSlug}/${segment}/${id}/documents`}
        icon={PREVIEW_LIST_TYPES.document.icon}
        emptyText={Translator.t('character_documents_preview.empty')}
        renderItem={(document) => <DocumentPreviewCard key={document.id} document={document} />}
      />
    </>
  );
}
