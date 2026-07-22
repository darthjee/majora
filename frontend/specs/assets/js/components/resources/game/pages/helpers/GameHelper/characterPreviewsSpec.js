import { renderToStaticMarkup } from 'react-dom/server';
import GameHelper from '../../../../../../../../../assets/js/components/resources/game/pages/helpers/GameHelper.jsx';
import { buildCharacter } from '../../../../../../../../support/factories.js';
import { game } from './support.js';

describe('GameHelper', function() {
  describe('.render', function() {
    it('renders the player characters preview section', function() {
      const pcs = [buildCharacter({ id: 1, name: 'Aragorn' })];
      const html = renderToStaticMarkup(GameHelper.render(game, pcs));
      expect(html).toContain('Player Characters');
      expect(html).toContain('Aragorn');
      expect(html).toContain('href="#/games/epic-quest/pcs"');
    });

    it('renders the preview section with no characters when pcs is empty', function() {
      const html = renderToStaticMarkup(GameHelper.render(game, []));
      expect(html).toContain('Player Characters');
      expect(html).toContain('href="#/games/epic-quest/pcs"');
    });

    it('renders the preview section when pcs is not provided', function() {
      expect(renderToStaticMarkup(GameHelper.render(game))).toContain('Player Characters');
    });

    it('renders the non-player characters preview section', function() {
      const npcs = [buildCharacter({ id: 2, name: 'Gandalf' })];
      const html = renderToStaticMarkup(GameHelper.render(game, [], npcs));
      expect(html).toContain('Non-Player Characters');
      expect(html).toContain('Gandalf');
      expect(html).toContain('href="#/games/epic-quest/npcs"');
    });

    it('renders the preview section with no characters when npcs is empty', function() {
      const html = renderToStaticMarkup(GameHelper.render(game, [], []));
      expect(html).toContain('Non-Player Characters');
      expect(html).toContain('href="#/games/epic-quest/npcs"');
    });

    it('renders the npcs preview section when npcs is not provided', function() {
      expect(renderToStaticMarkup(GameHelper.render(game))).toContain('Non-Player Characters');
    });

    // The pc/npc preview card tooltip-content wiring is exercised directly against
    // `GamePreviewSections` (the show-page slot component `GameHelper` now delegates to) in
    // `GamePreviewSectionsSpec.js`.
  });
});
