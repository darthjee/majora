import { renderToStaticMarkup } from 'react-dom/server';
import CharacterTreasuresPreviewHelper
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/helpers/CharacterTreasuresPreviewHelper.jsx';

describe('CharacterTreasuresPreviewHelper', function() {
  const title = 'Treasures';
  const seeAllHref = '#/games/epic-quest/pcs/1/treasures';

  const buildTreasures = (count) => Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    treasure_id: index + 101,
    name: `Treasure ${index + 1}`,
    quantity: index + 1,
    value: (index + 1) * 10,
    photo_path: null,
  }));

  describe('.render', function() {
    it('renders the title as a heading', function() {
      const html = renderToStaticMarkup(CharacterTreasuresPreviewHelper.render(buildTreasures(2), title, seeAllHref));
      expect(html).toContain('Treasures');
    });

    it('renders a card for each treasure when within the preview limit', function() {
      const html = renderToStaticMarkup(CharacterTreasuresPreviewHelper.render(buildTreasures(3), title, seeAllHref));
      expect(html).toContain('Treasure 1');
      expect(html).toContain('Treasure 2');
      expect(html).toContain('Treasure 3');
    });

    it('links each card to the underlying treasure_id, not the CharacterTreasure row id', function() {
      const html = renderToStaticMarkup(CharacterTreasuresPreviewHelper.render(buildTreasures(1), title, seeAllHref));
      expect(html).toContain('href="#/treasures/101"');
    });

    it('renders a quantity badge only when quantity is greater than 1', function() {
      const html = renderToStaticMarkup(CharacterTreasuresPreviewHelper.render(buildTreasures(2), title, seeAllHref));
      expect(html).not.toContain('×1');
      expect(html).toContain('×2');
    });

    it('slices the treasures to the max preview count', function() {
      const html = renderToStaticMarkup(CharacterTreasuresPreviewHelper.render(buildTreasures(8), title, seeAllHref));
      expect(html).toContain('Treasure 6');
      expect(html).not.toContain('Treasure 7');
      expect(html).not.toContain('Treasure 8');
    });

    it('renders a see all link with the provided href', function() {
      const html = renderToStaticMarkup(CharacterTreasuresPreviewHelper.render(buildTreasures(1), title, seeAllHref));
      expect(html).toContain(`href="${seeAllHref}"`);
      expect(html).toContain('See all Treasures');
    });

    it('renders an empty-state message and keeps the see all link when there are no treasures', function() {
      const html = renderToStaticMarkup(CharacterTreasuresPreviewHelper.render([], title, seeAllHref));
      expect(html).toContain('Treasures');
      expect(html).toContain(`href="${seeAllHref}"`);
    });

    it('renders each card value using the given gameType', function() {
      const treasures = [{
        id: 1, treasure_id: 101, name: 'Treasure 1', quantity: 1, value: 350, photo_path: null,
      }];
      const html = renderToStaticMarkup(
        CharacterTreasuresPreviewHelper.render(treasures, title, seeAllHref, 'deadlands')
      );
      expect(html).toContain('3 Dollars and 50 Cents');
    });

    it('defaults gameType to dnd when not given', function() {
      const html = renderToStaticMarkup(CharacterTreasuresPreviewHelper.render(buildTreasures(1), title, seeAllHref));
      expect(html).toContain('1 SP');
    });
  });
});
