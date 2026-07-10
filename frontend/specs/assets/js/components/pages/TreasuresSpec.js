import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Treasures from '../../../../../assets/js/components/pages/Treasures.jsx';
import TreasuresHelper from '../../../../../assets/js/components/pages/helpers/TreasuresHelper.jsx';
import TreasuresController from '../../../../../assets/js/components/pages/controllers/TreasuresController.js';
import Noop from '../../../../../assets/js/utils/Noop.js';
import { stubBuildEffect, stubRenderLoading } from '../../../../support/controllerStubs.js';

describe('Treasures', function() {
  it('renders the loading state while fetching', function() {
    stubBuildEffect(TreasuresController);
    stubRenderLoading(TreasuresHelper);

    const html = renderToStaticMarkup(React.createElement(Treasures));

    expect(html).toContain('loading');
  });

  it('renders an upload button per treasure via TreasuresHelper.render when isSuperUser is true', function() {
    stubBuildEffect(TreasuresController);

    const treasures = [{ id: 1, name: 'Golden Crown', value: 500 }];
    const pagination = { page: 1, pages: 1, perPage: 10 };
    const html = renderToStaticMarkup(
      TreasuresHelper.render(treasures, pagination, true, Noop.noop)
    );

    expect(html).toContain('actions-overlay-button');
  });
});
