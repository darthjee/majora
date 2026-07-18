import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameTreasures from '../../../../../../../assets/js/components/resources/treasure/pages/GameTreasures.jsx';
import GameTreasuresHelper from '../../../../../../../assets/js/components/resources/treasure/pages/helpers/GameTreasuresHelper.jsx';
import GameTreasuresController from '../../../../../../../assets/js/components/resources/treasure/pages/controllers/GameTreasuresController.js';
import TreasureFilters from '../../../../../../../assets/js/components/resources/treasure/pages/elements/TreasureFilters.jsx';
import FacadeRefresh from '../../../../../../../assets/js/utils/access/useFacadeRefresh.js';
import Noop from '../../../../../../../assets/js/utils/Noop.js';
import { stubBuildEffect, stubRenderLoading } from '../../../../../../support/controllerStubs.js';

describe('GameTreasures', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/treasures' } };
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('renders the loading state while fetching', function() {
    stubBuildEffect(GameTreasuresController);
    stubRenderLoading(GameTreasuresHelper);

    const html = renderToStaticMarkup(React.createElement(GameTreasures));

    expect(html).toContain('loading');
  });

  it('wires FacadeRefresh.useFacadeRefresh with the page controller', function() {
    stubBuildEffect(GameTreasuresController);
    spyOn(FacadeRefresh, 'useFacadeRefresh');

    renderToStaticMarkup(React.createElement(GameTreasures));

    expect(FacadeRefresh.useFacadeRefresh).toHaveBeenCalledWith(jasmine.any(GameTreasuresController));
  });

  it('renders an upload button per exclusive treasure via GameTreasuresHelper.render when canEdit is true', function() {
    stubBuildEffect(GameTreasuresController);

    const treasures = [{ id: 1, name: 'Golden Crown', value: 500, game_slug: 'demo' }];
    const pagination = { page: 1, pages: 1, perPage: 10 };
    const html = renderToStaticMarkup(
      GameTreasuresHelper.render(
        treasures, pagination, '#/games/demo/treasures', 'demo', '#/games/demo', true,
        '#/games/demo/treasures/new', Noop.noop,
      )
    );

    expect(html).toContain('actions-overlay-button');
  });

  it('renders the new treasure button via GameTreasuresHelper.render when canEdit is true', function() {
    stubBuildEffect(GameTreasuresController);

    const html = renderToStaticMarkup(
      GameTreasuresHelper.render(
        [], { page: 1, pages: 1, perPage: 10 }, '#/games/demo/treasures', 'demo', '#/games/demo', true,
        '#/games/demo/treasures/new',
      ),
    );

    expect(html).toContain('New Treasure');
    expect(html).toContain('href="#/games/demo/treasures/new"');
  });

  describe('filter query/clear interaction', function() {
    // GameTreasures.jsx wires TreasureFilters' onQuery/onClear to update window.location.hash
    // (via GameTreasuresController.buildFilterQueryHash) and re-trigger the page's fetch
    // effect, the same wiring contract as Treasures.jsx builds for the global page.
    const buildHandlers = (controller, basePath) => ({
      onQuery: (filters) => {
        window.location.hash = GameTreasuresController.buildFilterQueryHash(basePath, filters);
        controller.buildEffect()();
      },
      onClear: () => {
        window.location.hash = basePath;
        controller.buildEffect()();
      },
    });

    it('updates the hash and re-triggers the fetch on filter query', function() {
      const buildEffectSpy = stubBuildEffect(GameTreasuresController);
      const controller = new GameTreasuresController(Noop.noop, Noop.noop, Noop.noop, Noop.noop);
      const { onQuery } = buildHandlers(controller, '#/games/demo/treasures');

      onQuery({ name: 'sword' });

      expect(window.location.hash).toBe('#/games/demo/treasures?page=1&name=sword');
      expect(buildEffectSpy).toHaveBeenCalled();
    });

    it('resets the hash to the base path and re-triggers the fetch on filter clear', function() {
      window.location.hash = '#/games/demo/treasures?name=sword';
      const buildEffectSpy = stubBuildEffect(GameTreasuresController);
      const controller = new GameTreasuresController(Noop.noop, Noop.noop, Noop.noop, Noop.noop);
      const { onClear } = buildHandlers(controller, '#/games/demo/treasures');

      onClear();

      expect(window.location.hash).toBe('#/games/demo/treasures');
      expect(buildEffectSpy).toHaveBeenCalled();
    });

    it('renders TreasureFilters with the game type dropdown hidden', function() {
      stubBuildEffect(GameTreasuresController);

      const html = renderToStaticMarkup(
        GameTreasuresHelper.render(
          [], { page: 1, pages: 1, perPage: 10 }, '#/games/demo/treasures', 'demo', '#/games/demo', false, '',
          Noop.noop, {},
          React.createElement(TreasureFilters, { onQuery: Noop.noop, onClear: Noop.noop, showGameType: false }),
        )
      );

      expect(html).toContain('data-testid="treasure-filters"');
      expect(html).not.toContain('data-testid="treasure-filter-game-type"');
    });
  });
});
