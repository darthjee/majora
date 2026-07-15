import { renderToStaticMarkup } from 'react-dom/server';
import GameHelper from '../../../../../../../../../assets/js/components/resources/game/pages/helpers/GameHelper.jsx';
import { game } from './support.js';

describe('GameHelper', function() {
  describe('.render', function() {
    it('renders the next session title and date when present', function() {
      const gameWithNextSession = { ...game, next_session: { title: 'Session 1', date: '2024-05-01' } };
      const html = renderToStaticMarkup(GameHelper.render(gameWithNextSession));
      expect(html).toContain('Session 1');
      expect(html).toContain('2024-05-01');
    });

    it('renders a no-date placeholder when the next session has no date', function() {
      const gameWithNextSession = { ...game, next_session: { title: 'Session 1', date: null } };
      const html = renderToStaticMarkup(GameHelper.render(gameWithNextSession));
      expect(html).toContain('No date');
    });

    it('renders an empty state when there is no next session', function() {
      const gameWithoutNextSession = { ...game, next_session: null };
      const html = renderToStaticMarkup(GameHelper.render(gameWithoutNextSession));
      expect(html).toContain('No upcoming session scheduled.');
    });

    it('renders an empty state when next_session is not provided', function() {
      const html = renderToStaticMarkup(GameHelper.render(game));
      expect(html).toContain('No upcoming session scheduled.');
    });
  });
});
