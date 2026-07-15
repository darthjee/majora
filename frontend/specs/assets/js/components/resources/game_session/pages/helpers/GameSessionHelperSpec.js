import { renderToStaticMarkup } from 'react-dom/server';
import GameSessionHelper from '../../../../../../../../assets/js/components/resources/game_session/pages/helpers/GameSessionHelper.jsx';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';

describe('GameSessionHelper', function() {
  const session = {
    id: 7, title: 'Session 1', date: '2024-01-01', game_slug: 'demo',
  };
  const messagesState = {
    messages: [], nextEntryId: null, loadingMore: false, content: '', posting: false, fieldErrors: {},
  };
  const messagesHandlers = { onLoadMore: Noop.noop, onContentChange: Noop.noop, onSubmit: Noop.noop };

  describe('.render', function() {
    it('renders the session title', function() {
      expect(renderToStaticMarkup(GameSessionHelper.render(session, messagesState, messagesHandlers)))
        .toContain('Session 1');
    });

    it('renders the session date', function() {
      expect(renderToStaticMarkup(GameSessionHelper.render(session, messagesState, messagesHandlers)))
        .toContain('2024-01-01');
    });

    it('renders a no-date placeholder when date is absent', function() {
      const html = renderToStaticMarkup(
        GameSessionHelper.render({ ...session, date: null }, messagesState, messagesHandlers),
      );
      expect(html).toContain('No date');
    });

    it('renders a back button to the sessions index', function() {
      const html = renderToStaticMarkup(GameSessionHelper.render(session, messagesState, messagesHandlers));
      expect(html).toContain('href="#/games/demo/sessions"');
    });

    it('renders an edit link when can_edit is true', function() {
      const html = renderToStaticMarkup(
        GameSessionHelper.render({ ...session, can_edit: true }, messagesState, messagesHandlers),
      );
      expect(html).toContain('href="#/games/demo/sessions/7/edit"');
    });

    it('does not render an edit link when can_edit is false', function() {
      const html = renderToStaticMarkup(
        GameSessionHelper.render({ ...session, can_edit: false }, messagesState, messagesHandlers),
      );
      expect(html).not.toContain('/edit');
    });

    it('does not render an edit link when can_edit is absent', function() {
      const html = renderToStaticMarkup(GameSessionHelper.render(session, messagesState, messagesHandlers));
      expect(html).not.toContain('/edit');
    });

    it('renders the description when present', function() {
      const html = renderToStaticMarkup(
        GameSessionHelper.render({ ...session, description: 'A thrilling encounter.' }, messagesState, messagesHandlers),
      );
      expect(html).toContain('A thrilling encounter.');
      expect(html).toContain('text-pre-wrap');
    });

    it('does not render a description paragraph when description is absent', function() {
      const html = renderToStaticMarkup(GameSessionHelper.render(session, messagesState, messagesHandlers));
      expect(html).not.toContain('mt-3 text-pre-wrap');
    });

    it('renders the messages section', function() {
      const html = renderToStaticMarkup(GameSessionHelper.render(session, messagesState, messagesHandlers));
      expect(html).toContain('Messages');
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
