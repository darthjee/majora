import { renderToStaticMarkup } from 'react-dom/server';
import AppHelper from '../../../../../assets/js/components/helpers/AppHelper.jsx';

describe('AppHelper', function() {
  it('renders page content for known pages', function() {
    expect(renderToStaticMarkup(AppHelper.render('games', '#/games'))).toContain('Loading games...');
    expect(renderToStaticMarkup(AppHelper.render('npcCharacter', '#/games/demo/npcs/1'))).toContain('Loading character...');
    expect(renderToStaticMarkup(AppHelper.render('pcCharacter', '#/games/demo/pcs/1'))).toContain('Loading character...');
    expect(renderToStaticMarkup(AppHelper.render('recoverPassword', '#/recover-password'))).toContain('Reset password');
  });

  it('falls back to home page for unknown page key', function() {
    expect(renderToStaticMarkup(AppHelper.render('unknown', '#/other'))).toContain('Loading games...');
  });
});
