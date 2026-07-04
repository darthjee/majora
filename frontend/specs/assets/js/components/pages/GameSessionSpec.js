import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameSession from '../../../../../assets/js/components/pages/GameSession.jsx';
import GameSessionController from '../../../../../assets/js/components/pages/controllers/GameSessionController.js';
import GameSessionHelper from '../../../../../assets/js/components/pages/helpers/GameSessionHelper.jsx';

describe('GameSession', function() {
  it('renders the loading state on initial render before the fetch resolves', function() {
    spyOn(GameSessionController.prototype, 'buildEffect').and.returnValue(() => () => {});
    spyOn(GameSessionHelper, 'renderLoading').and.returnValue(React.createElement('div', null, 'loading'));

    const html = renderToStaticMarkup(React.createElement(GameSession));

    expect(html).toContain('loading');
  });
});
