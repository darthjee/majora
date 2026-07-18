import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Games from '../../../../../../../assets/js/components/resources/game/pages/Games.jsx';
import GamesHelper from '../../../../../../../assets/js/components/resources/game/pages/helpers/GamesHelper.jsx';
import AuthStorage from '../../../../../../../assets/js/utils/auth/AuthStorage.js';

describe('Games', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  it('delegates rendering to GamesHelper.render with the current logged-in state', function() {
    AuthStorage.setToken('abc');
    const renderSpy = spyOn(GamesHelper, 'render').and.callThrough();

    renderToStaticMarkup(React.createElement(Games));

    expect(renderSpy).toHaveBeenCalledWith(true);
  });

  it('reflects a logged-out state', function() {
    const renderSpy = spyOn(GamesHelper, 'render').and.callThrough();

    renderToStaticMarkup(React.createElement(Games));

    expect(renderSpy).toHaveBeenCalledWith(false);
  });
});
