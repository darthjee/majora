import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import DurationController
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/controllers/DurationController.js';
import StaffStatisticsDurationBody
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/elements/StaffStatisticsDurationBody.jsx';
import StaffStatisticsFilterBarHelper
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/elements/helpers/StaffStatisticsFilterBarHelper.jsx';
import StaffStatisticsDurationHelper
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/StaffStatisticsDurationHelper.jsx';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';
import { captureConstructorFields, stubBuildEffect } from '../../../../../../../support/controllerStubs.js';

describe('StaffStatisticsDurationBody', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/staff/statistics/duration' } };
    stubBuildEffect(DurationController);
    spyOn(StaffStatisticsFilterBarHelper, 'render').and.returnValue(React.createElement('div'));
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  const render = () => renderToStaticMarkup(React.createElement(StaffStatisticsDurationBody));

  it('renders the shell on the duration tab in the loading state', function() {
    const html = render();

    expect(html).toContain(Translator.t('staff_statistics_page.title'));
    expect(html).toContain('<a class="nav-link active" aria-current="page" href="#/staff/statistics/duration">');
    expect(html).toContain(Translator.t('staff_statistics_page.charts_loading'));
  });

  it('renders the initial load state through the helper', function() {
    spyOn(StaffStatisticsDurationHelper, 'renderState').and.callThrough();

    render();

    expect(StaffStatisticsDurationHelper.renderState).toHaveBeenCalledWith({ data: null, loading: true, error: null });
  });

  it('wires the state setters into the controller', function() {
    const capture = captureConstructorFields(DurationController, ['setData', 'setLoading', 'setError']);

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
