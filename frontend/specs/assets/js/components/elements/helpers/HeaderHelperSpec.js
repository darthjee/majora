import { renderToStaticMarkup } from 'react-dom/server';
import HeaderHelper from '../../../../../../assets/js/components/elements/helpers/HeaderHelper.jsx';

describe('HeaderHelper', function() {
  const buildHandlers = () => ({
    onLoginClick: jasmine.createSpy('onLoginClick'),
    onLogoffClick: jasmine.createSpy('onLogoffClick'),
    onModalClose: jasmine.createSpy('onModalClose'),
    onLoginSuccess: jasmine.createSpy('onLoginSuccess'),
  });

  describe('.render', function() {
    it('renders a Login control when logged out', function() {
      const html = renderToStaticMarkup(
        HeaderHelper.render({ loggedIn: false, showModal: false }, buildHandlers())
      );

      expect(html).toContain('data-testid="auth-control"');
      expect(html).toContain('Login');
      expect(html).not.toContain('Logoff');
    });

    it('renders a Logoff control when logged in', function() {
      const html = renderToStaticMarkup(
        HeaderHelper.render({ loggedIn: true, showModal: false }, buildHandlers())
      );

      expect(html).toContain('data-testid="auth-control"');
      expect(html).toContain('Logoff');
    });

    it('renders a home link on the title', function() {
      const html = renderToStaticMarkup(
        HeaderHelper.render({ loggedIn: false, showModal: false }, buildHandlers())
      );

      expect(html).toContain('href="#/"');
      expect(html).toContain('Majora');
    });

    it('renders a Games nav link', function() {
      const html = renderToStaticMarkup(
        HeaderHelper.render({ loggedIn: false, showModal: false }, buildHandlers())
      );

      expect(html).toContain('href="#/games"');
      expect(html).toContain('Games');
    });
  });
});
