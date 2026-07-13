import { renderToStaticMarkup } from 'react-dom/server';
import GameTreasuresHelper from '../../../../../../../../assets/js/components/resources/treasure/pages/helpers/GameTreasuresHelper.jsx';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';

describe('GameTreasuresHelper', function() {
  const treasures = [
    { id: 1, name: 'Golden Crown', value: 500, game_slug: 'demo' },
    { id: 2, name: 'Silver Ring', value: 50, game_slug: null },
  ];
  const pagination = { page: 1, pages: 3, perPage: 10 };

  describe('.render', function() {
    it('renders each treasure name', function() {
      const html = renderToStaticMarkup(
        GameTreasuresHelper.render(treasures, pagination, '#/games/demo/treasures', 'demo', '#/games/demo')
      );
      expect(html).toContain('Golden Crown');
      expect(html).toContain('Silver Ring');
    });

    it('renders each treasure value as a coin breakdown', function() {
      const html = renderToStaticMarkup(
        GameTreasuresHelper.render(treasures, pagination, '#/games/demo/treasures', 'demo', '#/games/demo')
      );
      expect(html).toContain('5 GP');
      expect(html).toContain('5 SP');
    });

    it('renders treasure links to global treasure detail pages', function() {
      const html = renderToStaticMarkup(
        GameTreasuresHelper.render(treasures, pagination, '#/games/demo/treasures', 'demo', '#/games/demo')
      );
      expect(html).toContain('href="#/treasures/1"');
      expect(html).toContain('href="#/treasures/2"');
    });

    it('renders a back button to the parent game page', function() {
      const html = renderToStaticMarkup(
        GameTreasuresHelper.render(treasures, pagination, '#/games/demo/treasures', 'demo', '#/games/demo')
      );
      expect(html).toContain('href="#/games/demo"');
    });

    it('renders pagination', function() {
      const html = renderToStaticMarkup(
        GameTreasuresHelper.render(treasures, pagination, '#/games/demo/treasures', 'demo', '#/games/demo')
      );
      expect(html).toContain('pagination');
    });

    it('does not render the new treasure button when canEdit is false', function() {
      const html = renderToStaticMarkup(
        GameTreasuresHelper.render(
          treasures, pagination, '#/games/demo/treasures', 'demo', '#/games/demo', false,
          '#/games/demo/treasures/new', Noop.noop,
        )
      );
      expect(html).not.toContain('New Treasure');
    });

    it('renders the new treasure button when canEdit is true', function() {
      const html = renderToStaticMarkup(
        GameTreasuresHelper.render(
          treasures, pagination, '#/games/demo/treasures', 'demo', '#/games/demo', true,
          '#/games/demo/treasures/new', Noop.noop,
        )
      );
      expect(html).toContain('New Treasure');
      expect(html).toContain('href="#/games/demo/treasures/new"');
    });

    it('does not render upload buttons or edit links when canEdit is false', function() {
      const html = renderToStaticMarkup(
        GameTreasuresHelper.render(
          treasures, pagination, '#/games/demo/treasures', 'demo', '#/games/demo', false, '', Noop.noop
        )
      );
      expect(html).not.toContain('actions-overlay-button');
      expect(html).not.toContain('card-action-link');
    });

    it('renders an upload button and edit link only for treasures exclusive to the current game', function() {
      const html = renderToStaticMarkup(
        GameTreasuresHelper.render(
          treasures, pagination, '#/games/demo/treasures', 'demo', '#/games/demo', true, '', Noop.noop
        )
      );
      const uploadMatches = html.match(/actions-overlay-button/g) || [];
      expect(uploadMatches.length).toBe(1);
      expect(html).toContain('href="#/games/demo/treasures/1/edit"');
    });
  });

  describe('.renderLoading', function() {
    it('renders a loading message', function() {
      const html = renderToStaticMarkup(GameTreasuresHelper.renderLoading());
      expect(html).toContain('Loading');
    });
  });

  describe('.renderError', function() {
    it('renders the error in an alert', function() {
      const html = renderToStaticMarkup(GameTreasuresHelper.renderError('Something went wrong'));
      expect(html).toContain('Something went wrong');
      expect(html).toContain('alert');
    });
  });
});
