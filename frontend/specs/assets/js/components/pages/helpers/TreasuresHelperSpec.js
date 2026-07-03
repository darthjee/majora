import { renderToStaticMarkup } from 'react-dom/server';
import TreasuresHelper from '../../../../../../assets/js/components/pages/helpers/TreasuresHelper.jsx';

describe('TreasuresHelper', function() {
  const treasures = [
    { id: 1, name: 'Golden Crown', value: 500 },
    { id: 2, name: 'Silver Ring', value: 50 },
  ];
  const pagination = { page: 1, pages: 3, perPage: 10 };

  describe('.render', function() {
    it('renders each treasure name', function() {
      const html = renderToStaticMarkup(TreasuresHelper.render(treasures, pagination));
      expect(html).toContain('Golden Crown');
      expect(html).toContain('Silver Ring');
    });

    it('renders each treasure value', function() {
      const html = renderToStaticMarkup(TreasuresHelper.render(treasures, pagination));
      expect(html).toContain('500');
      expect(html).toContain('50');
    });

    it('renders treasure links to the treasure detail pages', function() {
      const html = renderToStaticMarkup(TreasuresHelper.render(treasures, pagination));
      expect(html).toContain('href="#/treasures/1"');
      expect(html).toContain('href="#/treasures/2"');
    });

    it('renders a back button to the home page', function() {
      const html = renderToStaticMarkup(TreasuresHelper.render(treasures, pagination));
      expect(html).toContain('href="#/"');
    });

    it('renders a New Treasure link', function() {
      const html = renderToStaticMarkup(TreasuresHelper.render(treasures, pagination));
      expect(html).toContain('href="#/treasures/new"');
    });

    it('renders pagination', function() {
      const html = renderToStaticMarkup(TreasuresHelper.render(treasures, pagination));
      expect(html).toContain('pagination');
    });
  });

  describe('.renderLoading', function() {
    it('renders a loading message', function() {
      const html = renderToStaticMarkup(TreasuresHelper.renderLoading());
      expect(html).toContain('Loading');
    });
  });

  describe('.renderError', function() {
    it('renders the error in an alert', function() {
      const html = renderToStaticMarkup(TreasuresHelper.renderError('Something went wrong'));
      expect(html).toContain('Something went wrong');
      expect(html).toContain('alert');
    });
  });
});
