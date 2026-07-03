import { renderToStaticMarkup } from 'react-dom/server';
import GameCharactersHelper from '../../../../../../assets/js/components/pages/helpers/GameCharactersHelper.jsx';

describe('GameCharactersHelper', function() {
  const characters = [
    { id: 1, name: 'Aragorn', profile_photo_path: null },
    { id: 2, name: 'Legolas', profile_photo_path: null },
  ];
  const pagination = { page: 1, pages: 3, perPage: 10 };

  describe('.render', function() {
    it('renders the page title', function() {
      const html = renderToStaticMarkup(
        GameCharactersHelper.render(
          characters, pagination, '#/games/eq/pcs', 'eq', 'Player Characters', 'pc', '#/games/eq',
        )
      );
      expect(html).toContain('Player Characters');
    });

    it('renders each character name', function() {
      const html = renderToStaticMarkup(
        GameCharactersHelper.render(
          characters, pagination, '#/games/eq/pcs', 'eq', 'Player Characters', 'pc', '#/games/eq',
        )
      );
      expect(html).toContain('Aragorn');
      expect(html).toContain('Legolas');
    });

    it('renders character links using gameSlug and characterType', function() {
      const html = renderToStaticMarkup(
        GameCharactersHelper.render(
          characters, pagination, '#/games/eq/pcs', 'eq', 'Player Characters', 'pc', '#/games/eq',
        )
      );
      expect(html).toContain('href="#/games/eq/pcs/1"');
      expect(html).toContain('href="#/games/eq/pcs/2"');
    });

    it('renders npc character links when characterType is npc', function() {
      const html = renderToStaticMarkup(
        GameCharactersHelper.render(
          characters, pagination, '#/games/eq/npcs', 'eq', 'Non-Player Characters', 'npc', '#/games/eq',
        )
      );
      expect(html).toContain('href="#/games/eq/npcs/1"');
      expect(html).toContain('href="#/games/eq/npcs/2"');
    });

    it('renders pagination', function() {
      const html = renderToStaticMarkup(
        GameCharactersHelper.render(
          characters, pagination, '#/games/eq/pcs', 'eq', 'Player Characters', 'pc', '#/games/eq',
        )
      );
      expect(html).toContain('pagination');
    });

    it('renders a back button to the parent game page', function() {
      const html = renderToStaticMarkup(
        GameCharactersHelper.render(
          characters, pagination, '#/games/eq/pcs', 'eq', 'Player Characters', 'pc', '#/games/eq',
        )
      );
      expect(html).toContain('href="#/games/eq"');
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
