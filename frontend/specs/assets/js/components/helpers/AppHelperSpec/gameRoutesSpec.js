import { renderToStaticMarkup } from 'react-dom/server';
import AppHelper from '../../../../../../assets/js/components/helpers/AppHelper.jsx';
import Translator from '../../../../../../assets/js/i18n/Translator.js';
import { runCases } from './support.js';

const CASES = [
  { page: 'games', hash: '#/games', expected: 'Loading games...' },
  { page: 'gameNpcNew', hash: '#/games/demo/npcs/new', expected: () => Translator.t('game_npc_new_page.title') },
  {
    page: 'gameTreasureNew',
    hash: '#/games/demo/treasures/new',
    expected: () => Translator.t('game_treasure_new_page.title'),
  },
  {
    page: 'gameTreasureEdit',
    hash: '#/games/demo/treasures/1/edit',
    expected: () => Translator.t('game_treasures_page.loading'),
  },
  { page: 'gamePlayer', hash: '#/games/demo/players/1', expected: () => Translator.t('player_page.loading') },
  { page: 'gameItems', hash: '#/games/demo/items', expected: () => Translator.t('game_items_page.loading') },
  { page: 'gameItemEdit', hash: '#/games/demo/items/1/edit', expected: () => Translator.t('item_page.loading') },
  { page: 'gameItemNew', hash: '#/games/demo/items/new', expected: () => Translator.t('item_new_page.title') },
  {
    page: 'gamePossessions',
    hash: '#/games/demo/possessions',
    expected: () => Translator.t('game_possessions_page.loading'),
  },
  {
    page: 'gamePossessionEdit',
    hash: '#/games/demo/possessions/1/edit',
    expected: () => Translator.t('possession_page.loading'),
  },
  {
    page: 'gamePossessionNew',
    hash: '#/games/demo/possessions/new',
    expected: () => Translator.t('possession_new_page.title'),
  },
  {
    page: 'gameCommonItems',
    hash: '#/games/demo/common_items',
    expected: () => Translator.t('game_common_items_page.loading'),
  },
  {
    page: 'gameCommonItemEdit',
    hash: '#/games/demo/common_items/1/edit',
    expected: () => Translator.t('common_item_page.loading'),
  },
  {
    page: 'gameCommonItemNew',
    hash: '#/games/demo/common_items/new',
    expected: () => Translator.t('common_item_new_page.title'),
  },
  { page: 'gameFactions', hash: '#/games/demo/factions', expected: () => Translator.t('game_factions_page.loading') },
  { page: 'gameFaction', hash: '#/games/demo/factions/1', expected: () => Translator.t('faction_page.loading') },
  { page: 'gameFactionEdit', hash: '#/games/demo/factions/1/edit', expected: () => Translator.t('faction_page.loading') },
  { page: 'gameDocuments', hash: '#/games/demo/documents', expected: () => Translator.t('game_documents_page.loading') },
  { page: 'gameDocument', hash: '#/games/demo/documents/1', expected: () => Translator.t('document_page.loading') },
  {
    page: 'gameDocumentEdit',
    hash: '#/games/demo/documents/1/edit',
    expected: () => Translator.t('document_page.loading'),
  },
  {
    page: 'gameDocumentNew',
    hash: '#/games/demo/documents/new',
    expected: () => Translator.t('document_new_page.title'),
  },
  {
    page: 'gameDocumentPhotos',
    hash: '#/games/demo/documents/1/photos',
    expected: () => Translator.t('game_document_photos_page.loading'),
  },
  {
    page: 'gameDocumentFiles',
    hash: '#/games/demo/documents/1/files',
    expected: () => Translator.t('game_document_files_page.loading'),
  },
  { page: 'myGames', hash: '#/my-games', expected: () => Translator.t('game_characters_page.loading') },
];

describe('AppHelper', function() {
  runCases(CASES);

  it('falls back to home page for unknown page key', function() {
    expect(renderToStaticMarkup(AppHelper.render('unknown', '#/other'))).toContain('Loading games...');
  });

  it('renders correctly when a language code is provided', function() {
    expect(renderToStaticMarkup(AppHelper.render('games', '#/games', 'en'))).toContain('Loading games...');
  });
});
