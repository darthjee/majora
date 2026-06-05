import { renderToStaticMarkup } from 'react-dom/server';
import AppHelper from '../../../../../assets/js/components/helpers/AppHelper.jsx';

describe('AppHelper', function() {
  it('renders page content for known pages', function() {
    expect(renderToStaticMarkup(AppHelper.render('games', '#/games'))).toContain('Loading games...');
    expect(renderToStaticMarkup(AppHelper.render('character', '#/games/demo/characters/1'))).toContain('Loading character...');
  });

  it('falls back to home page for unknown page key', function() {
    expect(renderToStaticMarkup(AppHelper.render('unknown', '#/other'))).toContain('Loading games...');
  });
});
