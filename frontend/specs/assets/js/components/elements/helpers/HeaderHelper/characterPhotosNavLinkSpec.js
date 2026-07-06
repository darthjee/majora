import { render } from './support.js';

describe('HeaderHelper', function() {
  describe('.render', function() {
    describe('character photos nav link', function() {
      it('renders a Photos link to the pc character photos page on the pcCharacter route', function() {
        const html = render({ route: { page: 'pcCharacter', gameSlug: 'epic-quest', characterId: '7' } });

        expect(html).toContain('href="#/games/epic-quest/pcs/7/photos"');
      });

      it('renders a Photos link to the npc character photos page on the npcCharacter route', function() {
        const html = render({ route: { page: 'npcCharacter', gameSlug: 'epic-quest', characterId: '9' } });

        expect(html).toContain('href="#/games/epic-quest/npcs/9/photos"');
      });

      it('does not render the Photos nav link on the game route', function() {
        const html = render({ route: { page: 'game', gameSlug: 'epic-quest' } });

        expect(html).not.toContain('pcs/7/photos');
        expect(html).not.toContain('npcs/9/photos');
      });

      it('does not render the Photos nav link on unrelated routes', function() {
        const html = render({ route: { page: 'home' } });

        expect(html).not.toContain('/photos"');
      });
    });
  });
});
