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

  it('renders the actions', function() {
    stubBuildEffect(MemoryCacheCardController);

    const html = renderToStaticMarkup(React.createElement(MemoryCacheCard));

    expect((html.match(/bi-database-fill-dash/g) || []).length).toBe(2);
  });
});
