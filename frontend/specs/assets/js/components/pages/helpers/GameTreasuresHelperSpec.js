import { renderToStaticMarkup } from 'react-dom/server';
import GameTreasuresHelper from '../../../../../../assets/js/components/pages/helpers/GameTreasuresHelper.jsx';
import Noop from '../../../../../../assets/js/utils/Noop.js';

describe('GameTreasuresHelper', function() {
  const treasures = [
    { id: 1, name: 'Golden Crown', value: 500 },
    { id: 2, name: 'Silver Ring', value: 50 },
  ];
  const pagination = { page: 1, pages: 3, perPage: 10 };

  describe('.render', function() {
    it('renders each treasure name', function() {
      const html = renderToStaticMarkup(
        GameTreasuresHelper.render(treasures, pagination, '#/games/demo/treasures', '#/games/demo')
      );
      expect(html).toContain('Golden Crown');
      expect(html).toContain('Silver Ring');
    });

    it('renders each treasure value', function() {
      const html = renderToStaticMarkup(
        GameTreasuresHelper.render(treasures, pagination, '#/games/demo/treasures', '#/games/demo')
      );
      expect(html).toContain('500');
      expect(html).toContain('50');
    });

    it('renders treasure links to global treasure detail pages', function() {
      const html = renderToStaticMarkup(
        GameTreasuresHelper.render(treasures, pagination, '#/games/demo/treasures', '#/games/demo')
      );
      expect(html).toContain('href="#/treasures/1"');
      expect(html).toContain('href="#/treasures/2"');
    });

    it('renders a back button to the parent game page', function() {
      const html = renderToStaticMarkup(
        GameTreasuresHelper.render(treasures, pagination, '#/games/demo/treasures', '#/games/demo')
      );
      expect(html).toContain('href="#/games/demo"');
    });

    it('renders pagination', function() {
      const html = renderToStaticMarkup(
        GameTreasuresHelper.render(treasures, pagination, '#/games/demo/treasures', '#/games/demo')
      );
      expect(html).toContain('pagination');
    });

    it('does not render upload buttons when isSuperUser is false', function() {
      const html = renderToStaticMarkup(
        GameTreasuresHelper.render(
          treasures, pagination, '#/games/demo/treasures', '#/games/demo', false, Noop.noop
        )
      );
      expect(html).not.toContain('photo-upload-overlay-button');
    });

    it('renders an upload button per treasure when isSuperUser is true', function() {
      const html = renderToStaticMarkup(
        GameTreasuresHelper.render(
          treasures, pagination, '#/games/demo/treasures', '#/games/demo', true, Noop.noop
        )
      );
      const matches = html.match(/photo-upload-overlay-button/g) || [];
      expect(matches.length).toBe(treasures.length);
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
