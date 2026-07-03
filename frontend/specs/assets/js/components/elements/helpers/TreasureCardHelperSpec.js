import { renderToStaticMarkup } from 'react-dom/server';
import TreasureCardHelper from '../../../../../../assets/js/components/elements/helpers/TreasureCardHelper.jsx';

describe('TreasureCardHelper', function() {
  const treasure = { id: 42, name: 'Golden Crown', value: 500 };

  describe('.render', function() {
    it('renders the treasure name', function() {
      expect(renderToStaticMarkup(TreasureCardHelper.render(treasure)))
        .toContain('Golden Crown');
    });

    it('renders the treasure value', function() {
      expect(renderToStaticMarkup(TreasureCardHelper.render(treasure)))
        .toContain('500');
    });

    it('links to the treasure detail page', function() {
      expect(renderToStaticMarkup(TreasureCardHelper.render(treasure)))
        .toContain('href="#/treasures/42"');
    });

    it('renders the default treasure image', function() {
      const html = renderToStaticMarkup(TreasureCardHelper.render(treasure));
      expect(html).toContain('<img');
      expect(html).toContain('default_treasure.png');
    });

    it('applies Bootstrap card classes', function() {
      const html = renderToStaticMarkup(TreasureCardHelper.render(treasure));
      expect(html).toContain('card');
      expect(html).toContain('card-body');
      expect(html).toContain('card-title');
    });

    it('applies the 6-per-row column classes at lg', function() {
      const html = renderToStaticMarkup(TreasureCardHelper.render(treasure));
      expect(html).toContain('col-6 col-sm-4 col-md-3 col-lg-2');
    });

    it('uses the treasure name as the image alt text', function() {
      const html = renderToStaticMarkup(TreasureCardHelper.render(treasure));
      expect(html).toContain('alt="Golden Crown"');
    });
  });
});
