import { renderToStaticMarkup } from 'react-dom/server';
import ListPageHelper from '../../../../../../../assets/js/components/common/list_page/helpers/ListPageHelper.jsx';
import Noop from '../../../../../../../assets/js/utils/Noop.js';

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

    it('renders the availability line under the caption for capped treasures', function() {
      const capped = { ...treasures[0], available_units: 3, max_units: 10 };
      const html = renderToStaticMarkup(
        ListPageHelper.render('treasures', [capped], pagination, '#/games/demo/treasures', baseContext)
      );
      expect(html).toContain('Available: 3 / 10');
    });

    it('does not render an availability line for uncapped treasures', function() {
      const html = renderToStaticMarkup(
        ListPageHelper.render('treasures', treasures, pagination, '#/games/demo/treasures', baseContext)
      );
      expect(html).not.toContain('Available:');
    });
  });

  describe('items (a list type with no detail page)', function() {
    const items = [
      { id: 1, name: 'Cloak of Elvenkind' },
      { id: 2, name: 'Bag of Holding', hidden: true },
    ];
    const itemContext = { gameSlug: 'demo', canEdit: false };

    it('renders each item display text as plain, non-linked text', function() {
      const html = renderToStaticMarkup(
        ListPageHelper.render('items', items, pagination, '#/games/demo/items', itemContext)
      );
      expect(html).toContain('Cloak of Elvenkind');
      expect(html).toContain('Bag of Holding');
      expect(html).not.toContain('stretched-link');
    });

    it('never renders an upload button, since items are read-only', function() {
      const html = renderToStaticMarkup(
        ListPageHelper.render('items', items, pagination, '#/games/demo/items', itemContext)
      );
      expect(html).not.toContain('actions-overlay-button');
    });

    it('renders a hidden badge for hidden items', function() {
      const html = renderToStaticMarkup(
        ListPageHelper.render('items', items, pagination, '#/games/demo/items', itemContext)
      );
      expect(html).toContain('bi-eye-slash-fill');
    });
  });

  describe('npcs (a list type with a per-item buildCardClassName hook)', function() {
    const npcs = [
      { id: 1, name: 'Goblin', allegiance: 'enemy' },
      { id: 2, name: 'Villager', allegiance: 'ally' },
    ];
    const npcContext = { gameSlug: 'demo', canEdit: false };

    it('appends the allegiance border class to the outer card div', function() {
      const html = renderToStaticMarkup(
        ListPageHelper.render('npcs', npcs, pagination, '#/games/demo/npcs', npcContext)
      );
      expect(html).toContain('border border-danger');
      expect(html).toContain('border border-success');
    });
  });

  describe('treasures (a list type with no buildCardClassName hook)', function() {
    it('renders the outer card div without any extra class name', function() {
      const html = renderToStaticMarkup(
        ListPageHelper.render('treasures', treasures, pagination, '#/games/demo/treasures', baseContext)
      );
      expect(html).toContain('class="card h-100 position-relative"');
    });
  });

  describe('items per row', function() {
    it('renders col-lg-3 for a list type configured with itemsPerRow 4', function() {
      const games = [{ id: 1, name: 'Test Game', game_slug: 'test-game' }];
      const html = renderToStaticMarkup(
        ListPageHelper.render('games', games, pagination, '#/games', {})
      );
      expect(html).toContain('col-6 col-sm-4 col-md-3 col-lg-3 mb-4');
      expect(html).not.toContain('col-lg-2');
    });

    it('renders col-lg-2 for a list type left at the default itemsPerRow of 6', function() {
      const html = renderToStaticMarkup(
        ListPageHelper.render('treasures', treasures, pagination, '#/games/demo/treasures', baseContext)
      );
      expect(html).toContain('col-6 col-sm-4 col-md-3 col-lg-2 mb-4');
      expect(html).not.toContain('col-lg-3');
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
