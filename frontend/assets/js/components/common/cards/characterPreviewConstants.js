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
export const MAX_PREVIEW_PHOTOS = 11;

/**
 * Per-type configuration for `PreviewSection` call sites: an i18n title key and a `Icons.js` icon
 * used on the "see all" card.
 *
 * @description No entry provides an endpoint builder: `pc`/`npc` are fetched by
 *   `GameController#fetchPcsPreview`/`#fetchNpcsPreview` through `RequestStore.ensure()`
 *   (`pc.collection`/`npc.collection`, issue #791 phase 5/N), and `treasure`/`item`/`document`
 *   are now fetched the same way, through `CharacterListsController#fetchAndMergeTreasures`/
 *   `#fetchAndMergeItems`/`#fetchAndMergeDocuments` calling `RequestStore.ensure()`
 *   (`treasure.collection`/`item.collection`/`document.collection`, issue #805).
 * @type {object}
 */
export const PREVIEW_LIST_TYPES = {
  pc: {
    titleKey: 'game_page.player_characters',
    icon: Icons.filePerson,
  },
  npc: {
    titleKey: 'game_page.non_player_characters',
    icon: Icons.filePersonFill,
  },
  treasure: {
    titleKey: 'character_page.treasures_title',
    icon: Icons.gem,
  },
  item: {
    titleKey: 'character_page.items_title',
    icon: Icons.box2HeartFill,
  },
  document: {
    titleKey: 'character_page.documents_title',
    icon: Icons.folder,
  },
};
