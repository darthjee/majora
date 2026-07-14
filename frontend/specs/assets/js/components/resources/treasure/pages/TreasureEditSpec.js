import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import TreasureEdit from '../../../../../../../assets/js/components/resources/treasure/pages/TreasureEdit.jsx';
import TreasureEditController from '../../../../../../../assets/js/components/resources/treasure/pages/controllers/TreasureEditController.js';
import TreasureEditHelper from '../../../../../../../assets/js/components/resources/treasure/pages/helpers/TreasureEditHelper.jsx';
import { stubBuildEffect, stubRenderLoading } from '../../../../../../support/controllerStubs.js';

describe('TreasureEdit', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/treasures/42/edit' } };
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('renders the loading state on initial render before the fetch resolves', function() {
    stubBuildEffect(TreasureEditController);
    stubRenderLoading(TreasureEditHelper);

    const html = renderToStaticMarkup(React.createElement(TreasureEdit));

    expect(html).toContain('loading');
  });
});
