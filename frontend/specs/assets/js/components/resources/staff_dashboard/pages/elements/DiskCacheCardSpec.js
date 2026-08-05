import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import DiskCacheCard from '../../../../../../../../assets/js/components/resources/staff_dashboard/pages/elements/DiskCacheCard.jsx';
import DiskCacheCardController from '../../../../../../../../assets/js/components/resources/staff_dashboard/pages/elements/controllers/DiskCacheCardController.js';
import { stubBuildEffect } from '../../../../../../../support/controllerStubs.js';

describe('DiskCacheCard', function() {
  it('renders the loading state while the size has not resolved yet', function() {
    stubBuildEffect(DiskCacheCardController);

    const html = renderToStaticMarkup(React.createElement(DiskCacheCard));

    expect(html).toContain('Disk Cache');
    expect(html).toContain('Loading dashboard...');
  });

  it('renders the clear-cache and refresh actions', function() {
    stubBuildEffect(DiskCacheCardController);

    const html = renderToStaticMarkup(React.createElement(DiskCacheCard));

    expect(html).toContain('bi-trash-fill');
    expect(html).toContain('bi-arrow-clockwise');
  });
});
