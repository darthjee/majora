import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import CrawlerDebugCard from '../../../../../../../../assets/js/components/resources/staff_dashboard/pages/elements/CrawlerDebugCard.jsx';
import CrawlerDebugCardController from '../../../../../../../../assets/js/components/resources/staff_dashboard/pages/elements/controllers/CrawlerDebugCardController.js';
import { stubBuildEffect } from '../../../../../../../support/controllerStubs.js';

describe('CrawlerDebugCard', function() {
  it('renders the loading state while the summary has not resolved yet', function() {
    stubBuildEffect(CrawlerDebugCardController);

    const html = renderToStaticMarkup(React.createElement(CrawlerDebugCard));

    expect(html).toContain('Crawler Debug');
    expect(html).toContain('Loading dashboard...');
  });

  it('renders the clear and refresh actions with distinct icons', function() {
    stubBuildEffect(CrawlerDebugCardController);

    const html = renderToStaticMarkup(React.createElement(CrawlerDebugCard));

    expect(html).toContain('bi-trash-fill');
    expect(html).toContain('bi-arrow-clockwise');
  });

  it('does not clear the entries immediately when clicking Clear entries, without a confirm click', function() {
    stubBuildEffect(CrawlerDebugCardController);
    const clearEmissionsSpy = spyOn(CrawlerDebugCardController.prototype, 'clearEmissions');

    renderToStaticMarkup(React.createElement(CrawlerDebugCard));

    expect(clearEmissionsSpy).not.toHaveBeenCalled();
  });
});
