import { renderToStaticMarkup } from 'react-dom/server';
import AppHelper from '../../../../../assets/js/components/helpers/AppHelper.jsx';
import Translator from '../../../../../assets/js/i18n/Translator.js';

describe('AppHelper', function() {
  it('renders page content for known pages', function() {
    expect(renderToStaticMarkup(AppHelper.render('games', '#/games'))).toContain('Loading games...');
    expect(renderToStaticMarkup(AppHelper.render('npcCharacter', '#/games/demo/npcs/1'))).toContain('Loading character...');
    expect(renderToStaticMarkup(AppHelper.render('gameNpcNew', '#/games/demo/npcs/new'))).toContain(Translator.t('game_npc_new_page.title'));
    expect(renderToStaticMarkup(AppHelper.render('gameTreasureNew', '#/games/demo/treasures/new'))).toContain(Translator.t('game_treasure_new_page.title'));
    expect(renderToStaticMarkup(AppHelper.render('gameTreasureEdit', '#/games/demo/treasures/1/edit'))).toContain(Translator.t('game_treasures_page.loading'));
    expect(renderToStaticMarkup(AppHelper.render('pcCharacter', '#/games/demo/pcs/1'))).toContain('Loading character...');
    expect(renderToStaticMarkup(AppHelper.render('pcCharacterEdit', '#/games/demo/pcs/1/edit'))).toContain('Loading character...');
    expect(renderToStaticMarkup(AppHelper.render('pcCharacterPhotos', '#/games/demo/pcs/1/photos'))).toContain(Translator.t('pc_character_photos_page.loading'));
    expect(renderToStaticMarkup(AppHelper.render('npcCharacterPhotos', '#/games/demo/npcs/1/photos'))).toContain(Translator.t('npc_character_photos_page.loading'));
    expect(renderToStaticMarkup(AppHelper.render('pcCharacterTreasures', '#/games/demo/pcs/1/treasures'))).toContain(Translator.t('character_treasures_page.loading'));
    expect(renderToStaticMarkup(AppHelper.render('npcCharacterTreasures', '#/games/demo/npcs/1/treasures'))).toContain(Translator.t('character_treasures_page.loading'));
    expect(renderToStaticMarkup(AppHelper.render('gamePlayer', '#/games/demo/players/1'))).toContain(Translator.t('player_page.loading'));
    expect(renderToStaticMarkup(AppHelper.render('gameItems', '#/games/demo/items'))).toContain(Translator.t('game_items_page.loading'));
    expect(renderToStaticMarkup(AppHelper.render('gameItemEdit', '#/games/demo/items/1/edit'))).toContain(Translator.t('item_page.loading'));
    expect(renderToStaticMarkup(AppHelper.render('gameItemNew', '#/games/demo/items/new'))).toContain(Translator.t('item_new_page.title'));
    expect(renderToStaticMarkup(AppHelper.render('gamePossessions', '#/games/demo/possessions'))).toContain(Translator.t('game_possessions_page.loading'));
    expect(renderToStaticMarkup(AppHelper.render('gamePossessionEdit', '#/games/demo/possessions/1/edit'))).toContain(Translator.t('possession_page.loading'));
    expect(renderToStaticMarkup(AppHelper.render('gamePossessionNew', '#/games/demo/possessions/new'))).toContain(Translator.t('possession_new_page.title'));
    expect(renderToStaticMarkup(AppHelper.render('gameFactions', '#/games/demo/factions'))).toContain(Translator.t('game_factions_page.loading'));
    expect(renderToStaticMarkup(AppHelper.render('gameFaction', '#/games/demo/factions/1'))).toContain(Translator.t('faction_page.loading'));
    expect(renderToStaticMarkup(AppHelper.render('gameFactionEdit', '#/games/demo/factions/1/edit'))).toContain(Translator.t('faction_page.loading'));
    expect(renderToStaticMarkup(AppHelper.render('pcCharacterItems', '#/games/demo/pcs/1/items'))).toContain(Translator.t('character_items_page.loading'));
    expect(renderToStaticMarkup(AppHelper.render('npcCharacterItems', '#/games/demo/npcs/1/items'))).toContain(Translator.t('character_items_page.loading'));
    expect(renderToStaticMarkup(AppHelper.render('pcCharacterItemEdit', '#/games/demo/pcs/1/items/1/edit'))).toContain(Translator.t('item_page.loading'));
    expect(renderToStaticMarkup(AppHelper.render('npcCharacterItemEdit', '#/games/demo/npcs/1/items/1/edit'))).toContain(Translator.t('item_page.loading'));
    expect(renderToStaticMarkup(AppHelper.render('gameDocuments', '#/games/demo/documents'))).toContain(Translator.t('game_documents_page.loading'));
    expect(renderToStaticMarkup(AppHelper.render('gameDocument', '#/games/demo/documents/1'))).toContain(Translator.t('document_page.loading'));
    expect(renderToStaticMarkup(AppHelper.render('gameDocumentEdit', '#/games/demo/documents/1/edit'))).toContain(Translator.t('document_page.loading'));
    expect(renderToStaticMarkup(AppHelper.render('gameDocumentNew', '#/games/demo/documents/new'))).toContain(Translator.t('document_new_page.title'));
    expect(renderToStaticMarkup(AppHelper.render('gameDocumentPhotos', '#/games/demo/documents/1/photos'))).toContain(Translator.t('game_document_photos_page.loading'));
    expect(renderToStaticMarkup(AppHelper.render('gameDocumentFiles', '#/games/demo/documents/1/files'))).toContain(Translator.t('game_document_files_page.loading'));
    expect(renderToStaticMarkup(AppHelper.render('pcCharacterDocuments', '#/games/demo/pcs/1/documents'))).toContain(Translator.t('character_documents_page.loading'));
    expect(renderToStaticMarkup(AppHelper.render('npcCharacterDocuments', '#/games/demo/npcs/1/documents'))).toContain(Translator.t('character_documents_page.loading'));
    expect(renderToStaticMarkup(AppHelper.render('pcCharacterDocument', '#/games/demo/pcs/1/documents/1'))).toContain(Translator.t('character_document_page.loading'));
    expect(renderToStaticMarkup(AppHelper.render('npcCharacterDocument', '#/games/demo/npcs/1/documents/1'))).toContain(Translator.t('character_document_page.loading'));
    expect(renderToStaticMarkup(AppHelper.render('pcCharacterItemNew', '#/games/demo/pcs/1/items/new'))).toContain(Translator.t('item_new_page.title'));
    expect(renderToStaticMarkup(AppHelper.render('npcCharacterItemNew', '#/games/demo/npcs/1/items/new'))).toContain(Translator.t('item_new_page.title'));
    expect(renderToStaticMarkup(AppHelper.render('recoverPassword', '#/recover-password'))).toContain('Reset password');
    expect(renderToStaticMarkup(AppHelper.render('register', '#/users/register'))).toContain('Register');
    expect(renderToStaticMarkup(AppHelper.render('staffUsers', '#/staff/users'))).toContain(Translator.t('staff_users_page.loading'));
    expect(renderToStaticMarkup(AppHelper.render('staffUser', '#/staff/users/1'))).toContain(Translator.t('staff_user_page.loading'));
    expect(renderToStaticMarkup(AppHelper.render('staffUserEdit', '#/staff/users/1/edit'))).toContain(Translator.t('staff_user_page.loading'));
    expect(renderToStaticMarkup(AppHelper.render('myAccount', '#/my_account'))).toContain(Translator.t('my_account_page.loading'));
    expect(renderToStaticMarkup(AppHelper.render('accountAuthorizationRequests', '#/account/authorization_requests')))
      .toContain(Translator.t('authorization_requests_page.loading'));
    expect(renderToStaticMarkup(AppHelper.render('myGames', '#/my-games'))).toContain(Translator.t('game_characters_page.loading'));
    expect(renderToStaticMarkup(AppHelper.render('stlModels', '#/miniatures/stl_models'))).toContain(Translator.t('stl_models_page.loading'));
    expect(renderToStaticMarkup(AppHelper.render('stlModel', '#/miniatures/stl_models/1'))).toContain(Translator.t('stl_model_page.loading'));
    expect(renderToStaticMarkup(AppHelper.render('sources', '#/miniatures/sources'))).toContain(Translator.t('sources_page.loading'));
    expect(renderToStaticMarkup(AppHelper.render('source', '#/miniatures/sources/1'))).toContain(Translator.t('source_page.loading'));
    expect(renderToStaticMarkup(AppHelper.render('collections', '#/miniatures/collections'))).toContain(Translator.t('collections_page.loading'));
    expect(renderToStaticMarkup(AppHelper.render('collection', '#/miniatures/collections/1'))).toContain(Translator.t('collection_page.loading'));
  });

  it('falls back to home page for unknown page key', function() {
    expect(renderToStaticMarkup(AppHelper.render('unknown', '#/other'))).toContain('Loading games...');
  });

  it('renders correctly when a language code is provided', function() {
    expect(renderToStaticMarkup(AppHelper.render('games', '#/games', 'en'))).toContain('Loading games...');
  });
});
