import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import VisitorsController
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/controllers/VisitorsController.js';
import StaffStatisticsVisitorsBody
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/elements/StaffStatisticsVisitorsBody.jsx';
import StaffStatisticsFilterBarHelper
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/elements/helpers/StaffStatisticsFilterBarHelper.jsx';
import StaffStatisticsVisitorsHelper
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/StaffStatisticsVisitorsHelper.jsx';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';
import { captureConstructorFields, stubBuildEffect } from '../../../../../../../support/controllerStubs.js';

describe('StaffStatisticsVisitorsBody', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/staff/statistics/visitors' } };
    stubBuildEffect(VisitorsController);
    spyOn(StaffStatisticsFilterBarHelper, 'render').and.returnValue(React.createElement('div'));
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  const render = () => renderToStaticMarkup(React.createElement(StaffStatisticsVisitorsBody));

  it('renders the shell on the visitors tab in the loading state', function() {
    const html = render();

    expect(html).toContain(Translator.t('staff_statistics_page.title'));
    expect(html).toContain('<a class="nav-link active" aria-current="page" href="#/staff/statistics/visitors">');
    expect(html).toContain(Translator.t('staff_statistics_page.charts_loading'));
  });

  it('renders the initial load state through the helper', function() {
    spyOn(StaffStatisticsVisitorsHelper, 'renderState').and.callThrough();

    render();

    expect(StaffStatisticsVisitorsHelper.renderState).toHaveBeenCalledWith({ data: null, loading: true, error: null });
  });

  it('wires the state setters into the controller', function() {
    const capture = captureConstructorFields(VisitorsController, ['setData', 'setLoading', 'setError']);

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
