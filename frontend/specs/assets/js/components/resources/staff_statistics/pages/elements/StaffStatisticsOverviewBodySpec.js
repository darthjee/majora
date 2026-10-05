import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import OverviewController
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/controllers/OverviewController.js';
import StaffStatisticsOverviewBody
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/elements/StaffStatisticsOverviewBody.jsx';
import StaffStatisticsFilterBarHelper
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/elements/helpers/StaffStatisticsFilterBarHelper.jsx';
import StaffStatisticsOverviewHelper
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/StaffStatisticsOverviewHelper.jsx';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';
import { captureConstructorFields, stubBuildEffect } from '../../../../../../../support/controllerStubs.js';

describe('StaffStatisticsOverviewBody', function() {
  let originalWindow;
  let filterBarState;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/staff/statistics?range=7d&granularity=week' } };
    stubBuildEffect(OverviewController);
    spyOn(StaffStatisticsFilterBarHelper, 'render').and.callFake((state) => {
      filterBarState = state;
      return React.createElement('div');
    });
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  const render = () => renderToStaticMarkup(React.createElement(StaffStatisticsOverviewBody));

  it('renders the shell on the overview tab in the loading state', function() {
    const html = render();

    expect(html).toContain(Translator.t('staff_statistics_page.title'));
    expect(html).toContain(
      '<a class="nav-link active" aria-current="page" href="#/staff/statistics?range=7d&amp;granularity=week">',
    );
    expect(html).toContain(Translator.t('staff_statistics_page.overview.loading'));
  });

  it('hides the granularity in the filter bar but keeps it in the filters', function() {
    render();

    expect(filterBarState.showGranularity).toBeFalse();
    expect(filterBarState.filters.granularity).toBe('week');
  });

  it('renders the initial load state with the current filters through the helper', function() {
    spyOn(StaffStatisticsOverviewHelper, 'renderState').and.callThrough();

    render();

    expect(StaffStatisticsOverviewHelper.renderState).toHaveBeenCalledWith(
      { data: null, loading: true, error: null },
      jasmine.objectContaining({ range: '7d', granularity: 'week' }),
    );
  });

  it('wires the state setters into the controller', function() {
    const capture = captureConstructorFields(OverviewController, ['setData', 'setLoading', 'setError']);

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
