import { renderToStaticMarkup } from 'react-dom/server';
import ListPageHelper from '../../../../../../assets/js/components/common/helpers/ListPageHelper.jsx';
import Noop from '../../../../../../assets/js/utils/Noop.js';

describe('ListPageHelper', function() {
  const treasures = [
    { id: 1, name: 'Golden Crown', value: 500, game_slug: 'demo' },
    { id: 2, name: 'Silver Ring', value: 50, game_slug: null },
  ];
  const pagination = { page: 1, pages: 3, perPage: 10 };
  const baseContext = { gameSlug: 'demo', canEdit: false, onUploadClick: Noop.noop };

  describe('.render', function() {
    it('renders each item display text', function() {
      const html = renderToStaticMarkup(
        ListPageHelper.render('treasures', treasures, pagination, '#/games/demo/treasures', baseContext)
      );
      expect(html).toContain('Golden Crown');
      expect(html).toContain('Silver Ring');
    });

    it('renders each item formatted value under the caption', function() {
      const html = renderToStaticMarkup(
        ListPageHelper.render('treasures', treasures, pagination, '#/games/demo/treasures', baseContext)
      );
      expect(html).toContain('5 GP');
      expect(html).toContain('5 SP');
    });

    it('links each item to its buildItemHref target', function() {
      const html = renderToStaticMarkup(
        ListPageHelper.render('treasures', treasures, pagination, '#/games/demo/treasures', baseContext)
      );
      expect(html).toContain('href="#/treasures/1"');
      expect(html).toContain('href="#/treasures/2"');
    });

    it('renders pagination', function() {
      const html = renderToStaticMarkup(
        ListPageHelper.render('treasures', treasures, pagination, '#/games/demo/treasures', baseContext)
      );
      expect(html).toContain('pagination');
    });

    it('renders the type filters component with the given filtersProps', function() {
      const html = renderToStaticMarkup(
        ListPageHelper.render(
          'treasures', [], pagination, '#/games/demo/treasures', baseContext,
          { onQuery: Noop.noop, onClear: Noop.noop, showGameType: false },
        )
      );
      expect(html).toContain('data-testid="treasure-filters"');
      expect(html).not.toContain('data-testid="treasure-filter-game-type"');
    });

    it('does not render upload buttons when canEdit is false in context', function() {
      const html = renderToStaticMarkup(
        ListPageHelper.render('treasures', treasures, pagination, '#/games/demo/treasures', baseContext)
      );
      expect(html).not.toContain('actions-overlay-button');
    });

    it('renders an upload button only for the treasure exclusive to the current game', function() {
      const html = renderToStaticMarkup(
        ListPageHelper.render(
          'treasures', treasures, pagination, '#/games/demo/treasures', { ...baseContext, canEdit: true },
        )
      );
      const uploadMatches = html.match(/actions-overlay-button(-left)?"/g) || [];
      expect(uploadMatches.length).toBe(1);
    });

    it('renders a secondary edit button only for the treasure exclusive to the current game', function() {
      const html = renderToStaticMarkup(
        ListPageHelper.render(
          'treasures', treasures, pagination, '#/games/demo/treasures', { ...baseContext, canEdit: true },
        )
      );
      const editMatches = html.match(/actions-overlay-button-right"/g) || [];
      expect(editMatches.length).toBe(1);
    });

    it('preserves active filters on pagination links', function() {
      const html = renderToStaticMarkup(
        ListPageHelper.render(
          'treasures', treasures, pagination, '#/games/demo/treasures', baseContext, {}, { name: 'sword' },
        )
      );
      expect(html).toContain('name=sword');
    });

    it('renders a hidden badge for hidden treasures', function() {
      const html = renderToStaticMarkup(
        ListPageHelper.render(
          'treasures', [{ ...treasures[0], hidden: true }], pagination, '#/games/demo/treasures', baseContext,
        )
      );
      expect(html).toContain('bi-eye-slash-fill');
    });
  });

  describe('.renderLoading', function() {
    it('renders the given loading message', function() {
      const html = renderToStaticMarkup(ListPageHelper.renderLoading('Loading treasures...'));
      expect(html).toContain('Loading treasures...');
    });
  });

  describe('.renderError', function() {
    it('renders the error in an alert', function() {
      const html = renderToStaticMarkup(ListPageHelper.renderError('Something went wrong'));
      expect(html).toContain('Something went wrong');
      expect(html).toContain('alert');
    });
  });
});
