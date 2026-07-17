import { render } from './support.js';

describe('HeaderHelper', function() {
  describe('.render', function() {
    describe('character nav dropdown', function() {
      [
        { page: 'pcCharacter', label: 'PC' },
        { page: 'pcCharacterEdit', label: 'PC' },
        { page: 'pcCharacterPhotos', label: 'PC' },
        { page: 'pcCharacterTreasures', label: 'PC' },
      ].forEach(({ page, label }) => {
        it(`renders the ${label} dropdown with Overview/Photos/Treasures items on the ${page} route`, function() {
          const html = render({ route: { page, gameSlug: 'epic-quest', characterId: '7' } });

          expect(html).toContain(label);
          expect(html).toContain('href="#/games/epic-quest/pcs/7"');
          expect(html).toContain('href="#/games/epic-quest/pcs/7/photos"');
          expect(html).toContain('href="#/games/epic-quest/pcs/7/treasures"');
        });
      });

      [
        { page: 'npcCharacter', label: 'NPC' },
        { page: 'npcCharacterEdit', label: 'NPC' },
        { page: 'npcCharacterPhotos', label: 'NPC' },
        { page: 'npcCharacterTreasures', label: 'NPC' },
      ].forEach(({ page, label }) => {
        it(`renders the ${label} dropdown with Overview/Photos/Treasures items on the ${page} route`, function() {
          const html = render({ route: { page, gameSlug: 'epic-quest', characterId: '9' } });

          expect(html).toContain(label);
          expect(html).toContain('href="#/games/epic-quest/npcs/9"');
          expect(html).toContain('href="#/games/epic-quest/npcs/9/photos"');
          expect(html).toContain('href="#/games/epic-quest/npcs/9/treasures"');
        });
      });

      it('does not render the character dropdown on the game route', function() {
        const html = render({ route: { page: 'game', gameSlug: 'epic-quest' } });

        expect(html).not.toContain('pcs/7');
        expect(html).not.toContain('npcs/9');
      });

      it('does not render the character dropdown on unrelated routes', function() {
        const html = render({ route: { page: 'home' } });

        expect(html).not.toContain('header-pc-nav-dropdown');
        expect(html).not.toContain('header-npc-nav-dropdown');
      });
    });
  });
});
