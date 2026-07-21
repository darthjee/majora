import { render } from './support.js';

describe('HeaderHelper', function() {
  describe('.render', function() {
    describe('game nav dropdown', function() {
      it('renders Show/PCs/NPCs/Treasures/Items/Documents/Photos on any route with a resolved gameSlug', function() {
        const html = render({ route: { page: 'gameTasks', gameSlug: 'epic-quest' } });

        expect(html).toContain('Game');
        expect(html).toContain('href="#/games/epic-quest"');
        expect(html).toContain('href="#/games/epic-quest/pcs"');
        expect(html).toContain('href="#/games/epic-quest/npcs"');
        expect(html).toContain('href="#/games/epic-quest/treasures"');
        expect(html).toContain('href="#/games/epic-quest/items"');
        expect(html).toContain('href="#/games/epic-quest/documents"');
        expect(html).toContain('href="#/games/epic-quest/photos"');
      });

      it('does not render the Players/Polls/Sessions items when gameAccess grants no role', function() {
        const html = render({
          route: { page: 'game', gameSlug: 'epic-quest' },
          gameAccess: { is_dm: false, is_player: false, is_superuser: false, is_staff: false },
        });

        expect(html).not.toContain('href="#/games/epic-quest/players"');
        expect(html).not.toContain('href="#/games/epic-quest/polls"');
        expect(html).not.toContain('href="#/games/epic-quest/sessions"');
      });

      it('does not render the Players/Polls/Sessions items when gameAccess is absent', function() {
        const html = render({ route: { page: 'game', gameSlug: 'epic-quest' }, gameAccess: undefined });

        expect(html).not.toContain('href="#/games/epic-quest/players"');
        expect(html).not.toContain('href="#/games/epic-quest/polls"');
        expect(html).not.toContain('href="#/games/epic-quest/sessions"');
      });

      [
        { role: 'is_dm', gameAccess: { is_dm: true, is_player: false, is_superuser: false, is_staff: false } },
        { role: 'is_player', gameAccess: { is_dm: false, is_player: true, is_superuser: false, is_staff: false } },
        { role: 'is_superuser', gameAccess: { is_dm: false, is_player: false, is_superuser: true, is_staff: false } },
        { role: 'is_staff', gameAccess: { is_dm: false, is_player: false, is_superuser: false, is_staff: true } },
      ].forEach(({ role, gameAccess }) => {
        it(`renders the Players/Polls/Sessions items when the user is ${role}`, function() {
          const html = render({ route: { page: 'game', gameSlug: 'epic-quest' }, gameAccess });

          expect(html).toContain('href="#/games/epic-quest/players"');
          expect(html).toContain('href="#/games/epic-quest/polls"');
          expect(html).toContain('href="#/games/epic-quest/sessions"');
        });
      });

      it('does not render the game nav dropdown on unrelated routes', function() {
        const html = render({ route: { page: 'home' } });

        expect(html).not.toContain('/treasures"');
        expect(html).not.toContain('/sessions"');
      });

      it('does not render the game nav dropdown when route is absent', function() {
        const html = render({ route: undefined });

        expect(html).not.toContain('/treasures"');
        expect(html).not.toContain('/sessions"');
      });
    });
  });
});
