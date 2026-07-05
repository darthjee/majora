import { renderToStaticMarkup } from 'react-dom/server';
import CharacterTreasuresHelper
  from '../../../../../../assets/js/components/pages/helpers/CharacterTreasuresHelper.jsx';

describe('CharacterTreasuresHelper', function() {
  const treasures = [
    { id: 1, name: 'Golden Crown', quantity: 1, value: 500 },
    { id: 2, name: 'Silver Ring', quantity: 3, value: 50 },
  ];
  const pagination = { page: 1, pages: 3, perPage: 10 };

  describe('.render', function() {
    it('renders each treasure name', function() {
      const html = renderToStaticMarkup(
        CharacterTreasuresHelper.render(treasures, pagination, '#/games/demo/pcs/1/treasures', '#/games/demo/pcs/1')
      );
      expect(html).toContain('Golden Crown');
      expect(html).toContain('Silver Ring');
    });

    it('renders each treasure quantity and value', function() {
      const html = renderToStaticMarkup(
        CharacterTreasuresHelper.render(treasures, pagination, '#/games/demo/pcs/1/treasures', '#/games/demo/pcs/1')
      );
      expect(html).toContain('500');
      expect(html).toContain('50');
      expect(html).toContain('>1<');
      expect(html).toContain('>3<');
    });

    it('renders a back button to the parent character page', function() {
      const html = renderToStaticMarkup(
        CharacterTreasuresHelper.render(treasures, pagination, '#/games/demo/pcs/1/treasures', '#/games/demo/pcs/1')
      );
      expect(html).toContain('href="#/games/demo/pcs/1"');
    });

    it('renders pagination', function() {
      const html = renderToStaticMarkup(
        CharacterTreasuresHelper.render(treasures, pagination, '#/games/demo/pcs/1/treasures', '#/games/demo/pcs/1')
      );
      expect(html).toContain('pagination');
    });

    it('does not render any row actions', function() {
      const html = renderToStaticMarkup(
        CharacterTreasuresHelper.render(treasures, pagination, '#/games/demo/pcs/1/treasures', '#/games/demo/pcs/1')
      );
      expect(html).not.toContain('<button');
    });
  });

  describe('.renderLoading', function() {
    it('renders a loading message', function() {
      const html = renderToStaticMarkup(CharacterTreasuresHelper.renderLoading());
      expect(html).toContain('Loading');
    });
  });

  describe('.renderError', function() {
    it('renders the error in an alert', function() {
      const html = renderToStaticMarkup(CharacterTreasuresHelper.renderError('Something went wrong'));
      expect(html).toContain('Something went wrong');
      expect(html).toContain('alert');
    });
  });
});
