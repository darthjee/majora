import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import DomainsController
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/controllers/DomainsController.js';
import StaffStatisticsDomainsBody
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/elements/StaffStatisticsDomainsBody.jsx';
import StaffStatisticsFilterBarHelper
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/elements/helpers/StaffStatisticsFilterBarHelper.jsx';
import StaffStatisticsDomainsHelper
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/StaffStatisticsDomainsHelper.jsx';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';
import { captureConstructorFields, stubBuildEffect } from '../../../../../../../support/controllerStubs.js';

describe('StaffStatisticsDomainsBody', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/staff/statistics/domains?range=7d&audience=anonymous' } };
    stubBuildEffect(DomainsController);
    spyOn(StaffStatisticsFilterBarHelper, 'render').and.returnValue(React.createElement('div'));
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  const render = () => renderToStaticMarkup(React.createElement(StaffStatisticsDomainsBody));

  it('renders the shell on the domains tab in the loading state', function() {
    const html = render();

    expect(html).toContain(Translator.t('staff_statistics_page.title'));
    expect(html).toContain(
      '<a class="nav-link active" aria-current="page" href="#/staff/statistics/domains?range=7d&amp;audience=anonymous">',
    );
    expect(html).toContain(Translator.t('staff_statistics_page.charts_loading'));
  });

  it('hides the granularity control', function() {
    render();

    const [state] = StaffStatisticsFilterBarHelper.render.calls.mostRecent().args;

    expect(state.showGranularity).toBeFalse();
  });

  it('renders the initial load state through the helper with the current filters', function() {
    spyOn(StaffStatisticsDomainsHelper, 'renderState').and.callThrough();

    render();

    expect(StaffStatisticsDomainsHelper.renderState).toHaveBeenCalledWith(
      { data: null, loading: true, error: null },
      jasmine.objectContaining({ range: '7d', audience: 'anonymous' }),
    );
  });

  it('wires the state setters into the controller', function() {
    const capture = captureConstructorFields(DomainsController, ['setData', 'setLoading', 'setError']);

    try {
      render();

      expect(capture.spies.setData).toEqual(jasmine.any(Function));
      expect(capture.spies.setLoading).toEqual(jasmine.any(Function));
      expect(capture.spies.setError).toEqual(jasmine.any(Function));
    } finally {
      capture.restore();
    }
  });
});
