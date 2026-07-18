import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GamePcs from '../../../../../../../assets/js/components/resources/character/pages/GamePcs.jsx';
import GamePcsHelper from '../../../../../../../assets/js/components/resources/character/pages/helpers/GamePcsHelper.jsx';

describe('GamePcs', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/pcs' } };
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('delegates rendering to GamePcsHelper.render with the game slug from the hash', function() {
    const renderSpy = spyOn(GamePcsHelper, 'render').and.callThrough();

    renderToStaticMarkup(React.createElement(GamePcs));

    expect(renderSpy).toHaveBeenCalledWith('demo');
  });
});
