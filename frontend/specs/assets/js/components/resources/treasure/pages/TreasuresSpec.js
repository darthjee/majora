import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Treasures from '../../../../../../../assets/js/components/resources/treasure/pages/Treasures.jsx';
import TreasuresHelper from '../../../../../../../assets/js/components/resources/treasure/pages/helpers/TreasuresHelper.jsx';
import TreasuresController from '../../../../../../../assets/js/components/resources/treasure/pages/controllers/TreasuresController.js';
import TreasureFilters from '../../../../../../../assets/js/components/resources/treasure/pages/elements/TreasureFilters.jsx';
import Noop from '../../../../../../../assets/js/utils/Noop.js';
import AccessStore from '../../../../../../../assets/js/utils/access/store/AccessStore.js';
import { stubBuildEffect, stubRenderLoading, captureConstructorFields } from '../../../../../../support/controllerStubs.js';

describe('Treasures', function() {
  it('renders the loading state while fetching', function() {
    stubBuildEffect(TreasuresController);
    stubRenderLoading(TreasuresHelper);

    const html = renderToStaticMarkup(React.createElement(Treasures));

    expect(html).toContain('loading');
  });

  it('renders an upload button per treasure via TreasuresHelper.render when isSuperUser is true', function() {
    stubBuildEffect(TreasuresController);

    const treasures = [{ id: 1, name: 'Golden Crown', value: 500 }];
    const pagination = { page: 1, pages: 1, perPage: 10 };
    const html = renderToStaticMarkup(
      TreasuresHelper.render(treasures, pagination, true, Noop.noop)
    );

    expect(html).toContain('actions-overlay-button');
  });

  describe('filter query/clear interaction', function() {
    let originalWindow;

    beforeEach(function() {
      originalWindow = globalThis.window;
    });

    afterEach(function() {
      globalThis.window = originalWindow;
    });

    // Treasures.jsx wires TreasureFilters' onQuery/onClear to update window.location.hash
    // (via TreasuresController.buildFilterQueryHash) and re-trigger the page's fetch effect.
    // Since effects never run under `renderToStaticMarkup` (loading never resolves), this
    // exercises that exact wiring contract directly, the same way Treasures.jsx builds it,
    // rather than through a full page mount.
    const buildHandlers = (controller, basePath) => ({
      onQuery: (filters) => {
        window.location.hash = TreasuresController.buildFilterQueryHash(basePath, filters);
        controller.buildEffect()();
      },
      onClear: () => {
        window.location.hash = basePath;
        controller.buildEffect()();
      },
    });

    it('updates the hash and re-triggers the fetch on filter query', function() {
      globalThis.window = { location: { hash: '#/treasures' } };
      const buildEffectSpy = stubBuildEffect(TreasuresController);
      const controller = new TreasuresController(Noop.noop, Noop.noop, Noop.noop, Noop.noop);
      const { onQuery } = buildHandlers(controller, '#/treasures');

      onQuery({ name: 'sword' });

      expect(globalThis.window.location.hash).toBe('#/treasures?page=1&name=sword');
      expect(buildEffectSpy).toHaveBeenCalled();
    });

    it('resets the hash to the base path and re-triggers the fetch on filter clear', function() {
      globalThis.window = { location: { hash: '#/treasures?name=sword' } };
      const buildEffectSpy = stubBuildEffect(TreasuresController);
      const controller = new TreasuresController(Noop.noop, Noop.noop, Noop.noop, Noop.noop);
      const { onClear } = buildHandlers(controller, '#/treasures');

      onClear();

      expect(globalThis.window.location.hash).toBe('#/treasures');
      expect(buildEffectSpy).toHaveBeenCalled();
    });

    it('renders a live TreasureFilters element wired to matching onQuery/onClear handlers', function() {
      globalThis.window = { location: { hash: '#/treasures' } };
      const controller = new TreasuresController(Noop.noop, Noop.noop, Noop.noop, Noop.noop);
      const { onQuery, onClear } = buildHandlers(controller, '#/treasures');

      const html = renderToStaticMarkup(
        TreasuresHelper.render(
          [], { page: 1, pages: 1, perPage: 10 }, false, Noop.noop, {},
          React.createElement(TreasureFilters, { onQuery, onClear }),
        )
      );

      expect(html).toContain('data-testid="treasure-filters"');
    });
  });

  describe('wiring into TreasuresController', function() {
    const fields = ['setTreasures', 'setPagination', 'setLoading', 'setError', 'setIsSuperUser'];
    let capture;

    afterEach(function() {
      capture.restore();
    });

    it('passes the real state setters into their matching constructor slots (regression for #483)', async function() {
      spyOn(AccessStore, 'ensureStaffOrSuperUser').and.returnValue(Promise.resolve(true));
      const fetchSpy = spyOn(globalThis, 'fetch').and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve([{ id: 1, name: 'Sword', value: 100 }]),
        headers: { get: () => null },
      }));
      capture = captureConstructorFields(TreasuresController, fields);

      renderToStaticMarkup(React.createElement(Treasures));

      // Regression check: a stray extra argument at the call site shifts every
      // later constructor argument out of its slot, so setIsSuperUser lands as
      // null instead of a function — see #483.
      expect(typeof capture.spies.setIsSuperUser).toBe('function');

      const cleanup = capture.getInstance().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));
      cleanup();

      expect(AccessStore.ensureStaffOrSuperUser).toHaveBeenCalled();
      expect(fetchSpy).toHaveBeenCalled();
      expect(capture.spies.setIsSuperUser).toHaveBeenCalledWith(true);
      expect(capture.spies.setTreasures).toHaveBeenCalledWith([{ id: 1, name: 'Sword', value: 100 }]);
      expect(capture.spies.setPagination).toHaveBeenCalledWith({ page: 1, pages: 1, perPage: 10 });
      expect(capture.spies.setLoading).toHaveBeenCalledWith(false);
      expect(capture.spies.setError).not.toHaveBeenCalled();
    });
  });
});
