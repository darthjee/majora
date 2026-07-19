import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import MyGames from '../../../../../../../assets/js/components/resources/game/pages/MyGames.jsx';
import MyGamesHelper from '../../../../../../../assets/js/components/resources/game/pages/helpers/MyGamesHelper.jsx';

describe('MyGames', function() {
  it('delegates rendering to MyGamesHelper.render', function() {
    const renderSpy = spyOn(MyGamesHelper, 'render').and.callThrough();

    renderToStaticMarkup(React.createElement(MyGames));

    expect(renderSpy).toHaveBeenCalledWith();
  });
});
