import { render } from './support.js';

describe('HeaderHelper', function() {
  describe('.render', function() {
    describe('game nav links', function() {
      it('renders Treasures, Sessions and Photos nav links on the game route', function() {
        const html = render({ route: { page: 'game', gameSlug: 'epic-quest' } });

        expect(html).toContain('href="#/games/epic-quest/treasures"');
        expect(html).toContain('Treasures');
        expect(html).toContain('href="#/games/epic-quest/sessions"');
        expect(html).toContain('Sessions');
        expect(html).toContain('href="#/games/epic-quest/photos"');
        expect(html).toContain('Photos');
      });

      it('does not render the game nav links on other routes', function() {
        const html = render({ route: { page: 'home' } });

        expect(html).not.toContain('/treasures"');
        expect(html).not.toContain('/sessions"');
      });

      it('does not render the game nav links when route is absent', function() {
        const html = render({ route: undefined });

        expect(html).not.toContain('/treasures"');
        expect(html).not.toContain('/sessions"');
      });
    });
  });
});
