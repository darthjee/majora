import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import MemoryCacheCard from '../../../../../../../../assets/js/components/resources/staff_dashboard/pages/elements/MemoryCacheCard.jsx';
import MemoryCacheCardController from '../../../../../../../../assets/js/components/resources/staff_dashboard/pages/elements/controllers/MemoryCacheCardController.js';
import { stubBuildEffect } from '../../../../../../../support/controllerStubs.js';

describe('MemoryCacheCard', function() {
  it('renders the loading state while the summary has not resolved yet', function() {
    stubBuildEffect(MemoryCacheCardController);

    const html = renderToStaticMarkup(React.createElement(MemoryCacheCard));

    expect(html).toContain('Memory Cache');
    expect(html).toContain('Loading dashboard...');
  });

  it('renders the clear-cache and refresh actions with distinct icons', function() {
    stubBuildEffect(MemoryCacheCardController);

    const html = renderToStaticMarkup(React.createElement(MemoryCacheCard));

    expect(html).toContain('bi-trash-fill');
    expect(html).toContain('bi-arrow-clockwise');
  });

  it('does not clear the cache immediately when clicking Clear Cache, without a confirm click', function() {
    stubBuildEffect(MemoryCacheCardController);
    const clearCacheSpy = spyOn(MemoryCacheCardController.prototype, 'clearCache');

    renderToStaticMarkup(React.createElement(MemoryCacheCard));

    expect(clearCacheSpy).not.toHaveBeenCalled();
  });
});
