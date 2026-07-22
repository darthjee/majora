import React from 'react';
import CharacterPhotosPreview from '../CharacterPhotosPreview.jsx';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Show-mode bottom slot: the character's photo gallery preview, identical for PCs and NPCs,
 * matching `CharacterHelper#render`'s existing bottom section.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {string} context.game_slug - Game slug, used to build the "See all" href.
 * @param {number|string} context.id - Character id, used to build the "See all" href.
 * @param {boolean} [context.is_pc] - Whether the character is a PC, used to pick the URL segment.
 * @param {object[]} [context.photos] - Preview list of the character's photos.
 * @param {{onSelectPhoto: Function}} context.handlers - Event handlers.
 * @returns {React.ReactElement} Character photos preview section element.
 */
export default function CharacterPhotosPreviewSlot({
  game_slug: gameSlug, id, is_pc: isPc, photos = [], handlers,
}) {
  const segment = isPc ? 'pcs' : 'npcs';

  return (
    <CharacterPhotosPreview
      photos={photos}
      title={Translator.t('character_page.photos_title')}
      seeAllHref={`#/games/${gameSlug}/${segment}/${id}/photos`}
      onSelectPhoto={handlers.onSelectPhoto}
    />
  );
}
