import { renderToStaticMarkup } from 'react-dom/server';
import AppHelper from '../../../../../assets/js/components/helpers/AppHelper.jsx';
import Translator from '../../../../../assets/js/i18n/Translator.js';

describe('AppHelper', function() {
  it('renders page content for known pages', function() {
    expect(renderToStaticMarkup(AppHelper.render('games', '#/games'))).toContain('Loading games...');
    expect(renderToStaticMarkup(AppHelper.render('npcCharacter', '#/games/demo/npcs/1'))).toContain('Loading character...');
    expect(renderToStaticMarkup(AppHelper.render('pcCharacter', '#/games/demo/pcs/1'))).toContain('Loading character...');
    expect(renderToStaticMarkup(AppHelper.render('pcCharacterEdit', '#/games/demo/pcs/1/edit'))).toContain('Loading character...');
    expect(renderToStaticMarkup(AppHelper.render('pcCharacterPhotos', '#/games/demo/pcs/1/photos'))).toContain(Translator.t('pc_character_photos_page.loading'));
    expect(renderToStaticMarkup(AppHelper.render('npcCharacterPhotos', '#/games/demo/npcs/1/photos'))).toContain(Translator.t('npc_character_photos_page.loading'));
    expect(renderToStaticMarkup(AppHelper.render('recoverPassword', '#/recover-password'))).toContain('Reset password');
    expect(renderToStaticMarkup(AppHelper.render('register', '#/users/register'))).toContain('Register');
    expect(renderToStaticMarkup(AppHelper.render('staffUsers', '#/staff/users'))).toContain(Translator.t('staff_users_page.loading'));
    expect(renderToStaticMarkup(AppHelper.render('staffUser', '#/staff/users/1'))).toContain(Translator.t('staff_user_page.loading'));
    expect(renderToStaticMarkup(AppHelper.render('staffUserEdit', '#/staff/users/1/edit'))).toContain(Translator.t('staff_user_page.loading'));
  });

  it('falls back to home page for unknown page key', function() {
    expect(renderToStaticMarkup(AppHelper.render('unknown', '#/other'))).toContain('Loading games...');
  });

  it('renders correctly when a language code is provided', function() {
    expect(renderToStaticMarkup(AppHelper.render('games', '#/games', 'en'))).toContain('Loading games...');
  });
});
