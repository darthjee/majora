import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameSessionEdit from '../../../../../assets/js/components/pages/GameSessionEdit.jsx';
import GameSessionEditController from '../../../../../assets/js/components/pages/controllers/GameSessionEditController.js';
import GameSessionEditHelper from '../../../../../assets/js/components/pages/helpers/GameSessionEditHelper.jsx';
import { stubBuildEffect, stubRenderLoading } from '../../../../support/controllerStubs.js';

describe('GameSessionEdit', function() {
  it('renders the loading state on initial render before the fetch resolves', function() {
    stubBuildEffect(GameSessionEditController);
    stubRenderLoading(GameSessionEditHelper);

    const html = renderToStaticMarkup(React.createElement(GameSessionEdit));

    expect(html).toContain('loading');
  });
});
