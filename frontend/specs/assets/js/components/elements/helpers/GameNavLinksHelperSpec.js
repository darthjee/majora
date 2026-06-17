import { renderToStaticMarkup } from 'react-dom/server';
import GameNavLinksHelper from '../../../../../../assets/js/components/elements/helpers/GameNavLinksHelper.jsx';

describe('GameNavLinksHelper', function() {
  describe('.render', function() {
    it('does not render a link to the PCs page', function() {
      expect(renderToStaticMarkup(GameNavLinksHelper.render('epic-quest')))
        .not.toContain('href="#/games/epic-quest/pcs"');
    });

    it('renders a link to the NPCs page', function() {
      expect(renderToStaticMarkup(GameNavLinksHelper.render('epic-quest')))
        .toContain('href="#/games/epic-quest/npcs"');
    });

    it('uses the provided slug in the NPCs link', function() {
      const html = renderToStaticMarkup(GameNavLinksHelper.render('dragon-quest'));
      expect(html).toContain('href="#/games/dragon-quest/npcs"');
    });
  });
});
