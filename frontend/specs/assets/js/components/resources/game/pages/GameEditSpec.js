import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameEdit from '../../../../../../../assets/js/components/resources/game/pages/GameEdit.jsx';
import GameEditController from '../../../../../../../assets/js/components/resources/game/pages/controllers/GameEditController.js';
import GameEditHelper from '../../../../../../../assets/js/components/resources/game/pages/helpers/GameEditHelper.jsx';
import { stubBuildEffect, stubRenderLoading } from '../../../../../../support/controllerStubs.js';

describe('GameEdit', function() {
  it('renders the loading state on initial render before the fetch resolves', function() {
    stubBuildEffect(GameEditController);
    stubRenderLoading(GameEditHelper);

    const html = renderToStaticMarkup(React.createElement(GameEdit));

    expect(html).toContain('loading');
  });
});
