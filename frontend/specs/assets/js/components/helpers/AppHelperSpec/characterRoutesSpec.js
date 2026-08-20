import Translator from '../../../../../../assets/js/i18n/Translator.js';
import { runCases } from './support.js';

const CASES = [
  { page: 'npcCharacter', hash: '#/games/demo/npcs/1', expected: 'Loading character...' },
  { page: 'pcCharacter', hash: '#/games/demo/pcs/1', expected: 'Loading character...' },
  { page: 'pcCharacterEdit', hash: '#/games/demo/pcs/1/edit', expected: 'Loading character...' },
  {
    page: 'pcCharacterPhotos',
    hash: '#/games/demo/pcs/1/photos',
    expected: () => Translator.t('pc_character_photos_page.loading'),
  },
  {
    page: 'npcCharacterPhotos',
    hash: '#/games/demo/npcs/1/photos',
    expected: () => Translator.t('npc_character_photos_page.loading'),
  },
  {
    page: 'pcCharacterTreasures',
    hash: '#/games/demo/pcs/1/treasures',
    expected: () => Translator.t('character_treasures_page.loading'),
  },
  {
    page: 'npcCharacterTreasures',
    hash: '#/games/demo/npcs/1/treasures',
    expected: () => Translator.t('character_treasures_page.loading'),
  },
  {
    page: 'pcCharacterPossessions',
    hash: '#/games/demo/pcs/1/possessions',
    expected: () => Translator.t('character_possessions_page.loading'),
  },
  {
    page: 'npcCharacterPossessions',
    hash: '#/games/demo/npcs/1/possessions',
    expected: () => Translator.t('character_possessions_page.loading'),
  },
  {
    page: 'pcCharacterPossession',
    hash: '#/games/demo/pcs/1/possessions/1',
    expected: () => Translator.t('possession_page.loading'),
  },
  {
    page: 'npcCharacterPossession',
    hash: '#/games/demo/npcs/1/possessions/1',
    expected: () => Translator.t('possession_page.loading'),
  },
  {
    page: 'pcCharacterPossessionEdit',
    hash: '#/games/demo/pcs/1/possessions/1/edit',
    expected: () => Translator.t('possession_page.loading'),
  },
  {
    page: 'npcCharacterPossessionEdit',
    hash: '#/games/demo/npcs/1/possessions/1/edit',
    expected: () => Translator.t('possession_page.loading'),
  },
  {
    page: 'pcCharacterPossessionNew',
    hash: '#/games/demo/pcs/1/possessions/new',
    expected: () => Translator.t('possession_new_page.title'),
  },
  {
    page: 'npcCharacterPossessionNew',
    hash: '#/games/demo/npcs/1/possessions/new',
    expected: () => Translator.t('possession_new_page.title'),
  },
  {
    page: 'pcCharacterItems',
    hash: '#/games/demo/pcs/1/items',
    expected: () => Translator.t('character_items_page.loading'),
  },
  {
    page: 'npcCharacterItems',
    hash: '#/games/demo/npcs/1/items',
    expected: () => Translator.t('character_items_page.loading'),
  },
  { page: 'pcCharacterItemEdit', hash: '#/games/demo/pcs/1/items/1/edit', expected: () => Translator.t('item_page.loading') },
  {
    page: 'npcCharacterItemEdit',
    hash: '#/games/demo/npcs/1/items/1/edit',
    expected: () => Translator.t('item_page.loading'),
  },
  {
    page: 'pcCharacterDocuments',
    hash: '#/games/demo/pcs/1/documents',
    expected: () => Translator.t('character_documents_page.loading'),
  },
  {
    page: 'npcCharacterDocuments',
    hash: '#/games/demo/npcs/1/documents',
    expected: () => Translator.t('character_documents_page.loading'),
  },
  {
    page: 'pcCharacterDocument',
    hash: '#/games/demo/pcs/1/documents/1',
    expected: () => Translator.t('character_document_page.loading'),
  },
  {
    page: 'npcCharacterDocument',
    hash: '#/games/demo/npcs/1/documents/1',
    expected: () => Translator.t('character_document_page.loading'),
  },
  {
    page: 'pcCharacterFactions',
    hash: '#/games/demo/pcs/1/factions',
    expected: () => Translator.t('character_factions_page.loading'),
  },
  {
    page: 'npcCharacterFactions',
    hash: '#/games/demo/npcs/1/factions',
    expected: () => Translator.t('character_factions_page.loading'),
  },
  { page: 'pcCharacterItemNew', hash: '#/games/demo/pcs/1/items/new', expected: () => Translator.t('item_new_page.title') },
  {
    page: 'npcCharacterItemNew',
    hash: '#/games/demo/npcs/1/items/new',
    expected: () => Translator.t('item_new_page.title'),
  },
];

describe('AppHelper', function() {
  runCases(CASES);
});
