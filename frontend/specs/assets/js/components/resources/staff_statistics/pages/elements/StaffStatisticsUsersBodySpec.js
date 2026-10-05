import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import UsersController
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/controllers/UsersController.js';
import StaffStatisticsUsersBody
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/elements/StaffStatisticsUsersBody.jsx';
import StaffStatisticsFilterBarHelper
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/elements/helpers/StaffStatisticsFilterBarHelper.jsx';
import StaffStatisticsUsersHelper
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/StaffStatisticsUsersHelper.jsx';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';
import { captureConstructorFields, stubBuildEffect } from '../../../../../../../support/controllerStubs.js';

describe('StaffStatisticsUsersBody', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/staff/statistics/users?range=7d&audience=logged_in&sort=hits' } };
    stubBuildEffect(UsersController);
    spyOn(StaffStatisticsFilterBarHelper, 'render').and.returnValue(React.createElement('div'));
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  const render = () => renderToStaticMarkup(React.createElement(StaffStatisticsUsersBody));

  it('renders the shell on the users tab in the loading state', function() {
    const html = render();

    expect(html).toContain(Translator.t('staff_statistics_page.title'));
    expect(html).toContain(
      '<a class="nav-link active" aria-current="page" href="#/staff/statistics/users?range=7d&amp;audience=logged_in">',
    );
    expect(html).toContain(Translator.t('staff_statistics_page.charts_loading'));
  });

  it('hides the granularity control', function() {
    render();

    const [state] = StaffStatisticsFilterBarHelper.render.calls.mostRecent().args;

    expect(state.showGranularity).toBeFalse();
  });

  it('renders the initial load state through the helper with the current filters', function() {
    spyOn(StaffStatisticsUsersHelper, 'renderState').and.callThrough();

    render();

    expect(StaffStatisticsUsersHelper.renderState).toHaveBeenCalledWith(
      { data: null, loading: true, error: null },
      jasmine.objectContaining({ range: '7d', audience: 'logged_in' }),
    );
  });

  it('wires the state setters into the controller', function() {
    const capture = captureConstructorFields(UsersController, ['setData', 'setLoading', 'setError']);

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
