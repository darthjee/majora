import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import VisitsController
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/controllers/VisitsController.js';
import StaffStatisticsVisitsBody
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/elements/StaffStatisticsVisitsBody.jsx';
import StaffStatisticsFilterBarHelper
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/elements/helpers/StaffStatisticsFilterBarHelper.jsx';
import StaffStatisticsVisitsHelper
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/StaffStatisticsVisitsHelper.jsx';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';
import { captureConstructorFields, stubBuildEffect } from '../../../../../../../support/controllerStubs.js';

describe('StaffStatisticsVisitsBody', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/staff/statistics/visits' } };
    stubBuildEffect(VisitsController);
    spyOn(StaffStatisticsFilterBarHelper, 'render').and.returnValue(React.createElement('div'));
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  const render = () => renderToStaticMarkup(React.createElement(StaffStatisticsVisitsBody));

  it('renders the shell on the visits tab in the loading state', function() {
    const html = render();

    expect(html).toContain(Translator.t('staff_statistics_page.title'));
    expect(html).toContain('<a class="nav-link active" aria-current="page" href="#/staff/statistics/visits">');
    expect(html).toContain(Translator.t('staff_statistics_page.charts_loading'));
  });

  it('renders the initial load state through the helper', function() {
    spyOn(StaffStatisticsVisitsHelper, 'renderState').and.callThrough();

    render();

    expect(StaffStatisticsVisitsHelper.renderState).toHaveBeenCalledWith({ data: null, loading: true, error: null });
  });

  it('wires the state setters into the controller', function() {
    const capture = captureConstructorFields(VisitsController, ['setData', 'setLoading', 'setError']);

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
