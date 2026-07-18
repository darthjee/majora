import Icons from '../../../utils/ui/Icons.js';

/**
 * Maximum number of items shown in any preview section (PCs, NPCs,
 * Treasures), followed by a "see all" card.
 *
 * @type {number}
 */
export const MAX_PREVIEW_ITEMS = 5;

/**
 * Maximum number of photos shown in a character's photo preview section.
 *
 * @type {number}
 */
export const MAX_PREVIEW_PHOTOS = 6;

/**
 * Per-type configuration for `PreviewSection` call sites: an i18n title key,
 * a `Icons.js` icon used on the "see all" card, and (for `pc`/`npc`, whose
 * endpoint is a simple self-contained template string) an endpoint builder.
 *
 * @description `treasure`/`item`'s endpoints are deliberately not built here: they are
 *   already built by `CharacterClient#fetchCharacterTreasures`/`#fetchCharacterItems`
 *   (`CharacterController#fetchCharacterTreasures`/`#fetchCharacterItems`), a generic
 *   per-character-suffix client shared with unrelated endpoints (`full`,
 *   `access`, `permissions`, `money`, `photos`), so routing it through a
 *   type-keyed endpoint builder here would entangle two unrelated
 *   abstractions for no benefit.
 * @type {object}
 */
export const PREVIEW_LIST_TYPES = {
  pc: {
    titleKey: 'game_page.player_characters',
    icon: Icons.filePerson,
    buildEndpoint: ({ gameSlug }) => `/games/${gameSlug}/pcs.json`,
  },
  npc: {
    titleKey: 'game_page.non_player_characters',
    icon: Icons.filePersonFill,
    buildEndpoint: ({ gameSlug }) => `/games/${gameSlug}/npcs.json`,
    buildAuthEndpoint: ({ gameSlug }) => `/games/${gameSlug}/npcs/all.json`,
  },
  treasure: {
    titleKey: 'character_page.treasures_title',
    icon: Icons.gem,
  },
  item: {
    titleKey: 'character_page.items_title',
    icon: Icons.box2HeartFill,
  },
};
