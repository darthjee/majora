import { renderToStaticMarkup } from 'react-dom/server';
import TreasureHelper from '../../../../../../../../assets/js/components/resources/treasure/pages/helpers/TreasureHelper.jsx';

describe('TreasureHelper', function() {
  const treasure = { id: 42, name: 'Golden Crown', value: 500 };

  describe('.render', function() {
    it('renders the treasure name', function() {
      expect(renderToStaticMarkup(TreasureHelper.render(treasure))).toContain('Golden Crown');
    });

    it('renders the treasure value as a coin breakdown', function() {
      expect(renderToStaticMarkup(TreasureHelper.render(treasure))).toContain('5 GP');
    });

    it('renders a 0-value treasure as "0 GP"', function() {
      const html = renderToStaticMarkup(TreasureHelper.render({ ...treasure, value: 0 }));
      expect(html).toContain('0 GP');
    });

    it('renders a back button to the treasures index', function() {
      const html = renderToStaticMarkup(TreasureHelper.render(treasure));
      expect(html).toContain('href="#/treasures"');
    });

    it('renders an edit link when can_edit is true', function() {
      const html = renderToStaticMarkup(TreasureHelper.render({ ...treasure, can_edit: true }));
      expect(html).toContain('href="#/treasures/42/edit"');
    });

    it('does not render an edit link when can_edit is false', function() {
      const html = renderToStaticMarkup(TreasureHelper.render({ ...treasure, can_edit: false }));
      expect(html).not.toContain('/edit');
    });

    it('does not render an edit link when can_edit is absent', function() {
      const html = renderToStaticMarkup(TreasureHelper.render(treasure));
      expect(html).not.toContain('/edit');
    });
  });

  describe('.renderLoading', function() {
    it('renders a loading message', function() {
      expect(renderToStaticMarkup(TreasureHelper.renderLoading())).toContain('Loading treasure');
    });
  });

  describe('.renderError', function() {
    it('renders the error message in an alert', function() {
      const html = renderToStaticMarkup(TreasureHelper.renderError('Something went wrong'));
      expect(html).toContain('Something went wrong');
      expect(html).toContain('alert');
    });
  });
});
