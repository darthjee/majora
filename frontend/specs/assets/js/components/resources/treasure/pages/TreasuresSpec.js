import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Treasures, { buildFilterQueryHash } from '../../../../../../../assets/js/components/resources/treasure/pages/Treasures.jsx';
import TreasuresHelper from '../../../../../../../assets/js/components/resources/treasure/pages/helpers/TreasuresHelper.jsx';
import TreasuresAccessController from '../../../../../../../assets/js/components/resources/treasure/pages/controllers/TreasuresAccessController.js';
import AccessStore from '../../../../../../../assets/js/utils/access/store/AccessStore.js';
import { stubBuildEffect, captureConstructorFields } from '../../../../../../support/controllerStubs.js';

describe('Treasures', function() {
  it('renders the loading state before access is resolved', function() {
    stubBuildEffect(TreasuresAccessController);
    const renderLoadingSpy = spyOn(TreasuresHelper, 'renderLoading').and.callThrough();

    const html = renderToStaticMarkup(React.createElement(Treasures));

    expect(renderLoadingSpy).toHaveBeenCalled();
    expect(html).toContain('Loading');
  });

  it('wires the real allowed-state setter into TreasuresAccessController and resolves access', async function() {
    const fields = ['setAllowed'];
    const capture = captureConstructorFields(TreasuresAccessController, fields);
    spyOn(AccessStore, 'ensureStaffOrSuperUser').and.returnValue(Promise.resolve(true));

    renderToStaticMarkup(React.createElement(Treasures));

    const cleanup = capture.getInstance().buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));
    cleanup();

    expect(capture.spies.setAllowed).toHaveBeenCalledWith(true);

    capture.restore();
  });

  it('redirects away and never renders the treasures grid when access is denied', async function() {
    const fakeWindow = { location: { hash: '' } };
    globalThis.window = fakeWindow;
    spyOn(AccessStore, 'ensureStaffOrSuperUser').and.returnValue(Promise.resolve(false));
    const capture = captureConstructorFields(TreasuresAccessController, ['setAllowed']);

    try {
      renderToStaticMarkup(React.createElement(Treasures));

      const cleanup = capture.getInstance().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));
      cleanup();

      expect(fakeWindow.location.hash).toBe('/');
      expect(capture.spies.setAllowed).not.toHaveBeenCalled();
    } finally {
      capture.restore();
      delete globalThis.window;
    }
  });
});

describe('buildFilterQueryHash', function() {
  it('resets pagination to page 1 when no filters are active', function() {
    expect(buildFilterQueryHash({})).toBe('#/treasures?page=1');
  });

  it('includes the active game_type/min_value/max_value/name filters alongside the reset page', function() {
    expect(
      buildFilterQueryHash({ game_type: 'dnd', min_value: '10', max_value: '100', name: 'sword' })
    ).toBe('#/treasures?page=1&game_type=dnd&min_value=10&max_value=100&name=sword');
  });

  it('includes only the given filter when a single one is active', function() {
    expect(buildFilterQueryHash({ name: 'sword' })).toBe('#/treasures?page=1&name=sword');
  });
});
