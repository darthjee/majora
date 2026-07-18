import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameNpcs from '../../../../../../../assets/js/components/resources/character/pages/GameNpcs.jsx';
import GameCharactersHelper from '../../../../../../../assets/js/components/resources/character/pages/helpers/GameCharactersHelper.jsx';
import GameNpcsAccessController from '../../../../../../../assets/js/components/resources/character/pages/controllers/GameNpcsAccessController.js';
import FacadeRefresh from '../../../../../../../assets/js/utils/access/useFacadeRefresh.js';
import { stubBuildEffect } from '../../../../../../support/controllerStubs.js';

describe('GameNpcs', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/npcs' } };
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('renders via GameCharactersHelper.render with the game slug from the hash', function() {
    stubBuildEffect(GameNpcsAccessController);
    const renderSpy = spyOn(GameCharactersHelper, 'render').and.callThrough();

    renderToStaticMarkup(React.createElement(GameNpcs));

    expect(renderSpy).toHaveBeenCalled();
    expect(renderSpy.calls.mostRecent().args[0].gameSlug).toBe('demo');
    expect(renderSpy.calls.mostRecent().args[0].basePath).toBe('#/games/demo/npcs');
    expect(renderSpy.calls.mostRecent().args[0].backHref).toBe('#/games/demo');
    expect(renderSpy.calls.mostRecent().args[0].newHref).toBe('#/games/demo/npcs/new');
  });

  it('wires FacadeRefresh.useFacadeRefresh with the access controller', function() {
    stubBuildEffect(GameNpcsAccessController);
    spyOn(FacadeRefresh, 'useFacadeRefresh');

    renderToStaticMarkup(React.createElement(GameNpcs));

    expect(FacadeRefresh.useFacadeRefresh).toHaveBeenCalledWith(jasmine.any(GameNpcsAccessController));
  });

  it('renders no upload/slain modals visible by default', function() {
    stubBuildEffect(GameNpcsAccessController);

    const html = renderToStaticMarkup(React.createElement(GameNpcs));

    expect(html).not.toContain('modal show');
  });
});
