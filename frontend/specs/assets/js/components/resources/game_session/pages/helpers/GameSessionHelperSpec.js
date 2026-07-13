import { renderToStaticMarkup } from 'react-dom/server';
import GameSessionHelper from '../../../../../../../../assets/js/components/resources/game_session/pages/helpers/GameSessionHelper.jsx';

describe('GameSessionHelper', function() {
  const session = {
    id: 7, title: 'Session 1', date: '2024-01-01', game_slug: 'demo',
  };

  describe('.render', function() {
    it('renders the session title', function() {
      expect(renderToStaticMarkup(GameSessionHelper.render(session))).toContain('Session 1');
    });

    it('renders the session date', function() {
      expect(renderToStaticMarkup(GameSessionHelper.render(session))).toContain('2024-01-01');
    });

    it('renders a no-date placeholder when date is absent', function() {
      const html = renderToStaticMarkup(GameSessionHelper.render({ ...session, date: null }));
      expect(html).toContain('No date');
    });

    it('renders a back button to the sessions index', function() {
      const html = renderToStaticMarkup(GameSessionHelper.render(session));
      expect(html).toContain('href="#/games/demo/sessions"');
    });

    it('renders an edit link when can_edit is true', function() {
      const html = renderToStaticMarkup(GameSessionHelper.render({ ...session, can_edit: true }));
      expect(html).toContain('href="#/games/demo/sessions/7/edit"');
    });

    it('does not render an edit link when can_edit is false', function() {
      const html = renderToStaticMarkup(GameSessionHelper.render({ ...session, can_edit: false }));
      expect(html).not.toContain('/edit');
    });

    it('does not render an edit link when can_edit is absent', function() {
      const html = renderToStaticMarkup(GameSessionHelper.render(session));
      expect(html).not.toContain('/edit');
    });
  });

  describe('.renderLoading', function() {
    it('renders a loading message', function() {
      expect(renderToStaticMarkup(GameSessionHelper.renderLoading())).toContain('Loading session');
    });
  });

  describe('.renderError', function() {
    it('renders the error message in an alert', function() {
      const html = renderToStaticMarkup(GameSessionHelper.renderError('Something went wrong'));
      expect(html).toContain('Something went wrong');
      expect(html).toContain('alert');
    });
  });
});
