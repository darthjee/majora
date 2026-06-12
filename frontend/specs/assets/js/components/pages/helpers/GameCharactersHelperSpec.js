import { renderToStaticMarkup } from 'react-dom/server';
import GameCharactersHelper from '../../../../../../assets/js/components/pages/helpers/GameCharactersHelper.jsx';

describe('GameCharactersHelper', function() {
  const characters = [
    { id: 1, name: 'Aragorn', avatar_url: null },
    { id: 2, name: 'Legolas', avatar_url: null },
  ];
  const pagination = { page: 1, pages: 3, perPage: 10 };

  describe('.render', function() {
    it('renders the page title', function() {
      const html = renderToStaticMarkup(
        GameCharactersHelper.render(characters, pagination, '#/games/eq/pcs', 'eq', 'Player Characters')
      );
      expect(html).toContain('Player Characters');
    });

    it('renders each character name', function() {
      const html = renderToStaticMarkup(
        GameCharactersHelper.render(characters, pagination, '#/games/eq/pcs', 'eq', 'Player Characters')
      );
      expect(html).toContain('Aragorn');
      expect(html).toContain('Legolas');
    });

    it('renders character links using gameSlug', function() {
      const html = renderToStaticMarkup(
        GameCharactersHelper.render(characters, pagination, '#/games/eq/pcs', 'eq', 'Player Characters')
      );
      expect(html).toContain('href="#/games/eq/characters/1"');
      expect(html).toContain('href="#/games/eq/characters/2"');
    });

    it('renders pagination', function() {
      const html = renderToStaticMarkup(
        GameCharactersHelper.render(characters, pagination, '#/games/eq/pcs', 'eq', 'Player Characters')
      );
      expect(html).toContain('pagination');
    });
  });

  describe('.renderLoading', function() {
    it('renders a loading message', function() {
      expect(renderToStaticMarkup(GameCharactersHelper.renderLoading())).toContain('Loading');
    });
  });

  describe('.renderError', function() {
    it('renders the error in an alert', function() {
      const html = renderToStaticMarkup(GameCharactersHelper.renderError('Oops'));
      expect(html).toContain('Oops');
      expect(html).toContain('alert');
    });
  });
});
