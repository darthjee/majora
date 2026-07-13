import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameSession from '../../../../../../../assets/js/components/resources/game_session/pages/GameSession.jsx';
import GameSessionController from '../../../../../../../assets/js/components/resources/game_session/pages/controllers/GameSessionController.js';
import GameSessionHelper from '../../../../../../../assets/js/components/resources/game_session/pages/helpers/GameSessionHelper.jsx';
import { stubBuildEffect, stubRenderLoading } from '../../../../../../support/controllerStubs.js';

describe('GameSession', function() {
  it('renders the loading state on initial render before the fetch resolves', function() {
    stubBuildEffect(GameSessionController);
    stubRenderLoading(GameSessionHelper);

    const html = renderToStaticMarkup(React.createElement(GameSession));

    expect(html).toContain('loading');
  });
});
