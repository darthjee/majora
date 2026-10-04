import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffStatistics from '../../../../../../../assets/js/components/resources/staff_statistics/pages/StaffStatistics.jsx';
import StaffStatisticsVisits from '../../../../../../../assets/js/components/resources/staff_statistics/pages/StaffStatisticsVisits.jsx';
import StaffStatisticsVisitors from '../../../../../../../assets/js/components/resources/staff_statistics/pages/StaffStatisticsVisitors.jsx';
import StaffStatisticsDuration from '../../../../../../../assets/js/components/resources/staff_statistics/pages/StaffStatisticsDuration.jsx';
import StaffStatisticsDomains from '../../../../../../../assets/js/components/resources/staff_statistics/pages/StaffStatisticsDomains.jsx';
import StaffStatisticsUsers from '../../../../../../../assets/js/components/resources/staff_statistics/pages/StaffStatisticsUsers.jsx';
import StaffStatisticsVisitList from '../../../../../../../assets/js/components/resources/staff_statistics/pages/StaffStatisticsVisitList.jsx';
import StaffStatisticsPageController
  from '../../../../../../../assets/js/components/resources/staff_statistics/pages/controllers/StaffStatisticsPageController.js';
import StaffStatisticsFilterBarHelper
  from '../../../../../../../assets/js/components/resources/staff_statistics/pages/elements/helpers/StaffStatisticsFilterBarHelper.jsx';
import AccessStore from '../../../../../../../assets/js/utils/access/store/AccessStore.js';
import Translator from '../../../../../../../assets/js/i18n/Translator.js';
import { stubBuildEffect } from '../../../../../../support/controllerStubs.js';

const PAGES = [
  ['StaffStatistics', StaffStatistics, '#/staff/statistics'],
  ['StaffStatisticsVisits', StaffStatisticsVisits, '#/staff/statistics/visits'],
  ['StaffStatisticsVisitors', StaffStatisticsVisitors, '#/staff/statistics/visitors'],
  ['StaffStatisticsDuration', StaffStatisticsDuration, '#/staff/statistics/duration'],
  ['StaffStatisticsDomains', StaffStatisticsDomains, '#/staff/statistics/domains'],
  ['StaffStatisticsUsers', StaffStatisticsUsers, '#/staff/statistics/users'],
  ['StaffStatisticsVisitList', StaffStatisticsVisitList, '#/staff/statistics/visit-list'],
];

PAGES.forEach(([name, Component, path]) => {
  describe(name, function() {
    let originalWindow;

    beforeEach(function() {
      originalWindow = globalThis.window;
      globalThis.window = { location: { hash: path } };
      stubBuildEffect(StaffStatisticsPageController);
      spyOn(StaffStatisticsFilterBarHelper, 'render').and.returnValue(React.createElement('div'));
    });

    afterEach(function() {
      globalThis.window = originalWindow;
    });

    it('renders nothing before access is confirmed', function() {
      spyOn(AccessStore, 'isStaffOrSuperUser').and.returnValue(false);

      expect(renderToStaticMarkup(React.createElement(Component))).toBe('');
    });

    it('renders the shell with the placeholder and its tab active', function() {
      spyOn(AccessStore, 'isStaffOrSuperUser').and.returnValue(true);

      const html = renderToStaticMarkup(React.createElement(Component));

      expect(html).toContain(Translator.t('staff_statistics_page.title'));
      expect(html).toContain(Translator.t('staff_statistics_page.placeholder'));
      expect(html).toContain(`<a class="nav-link active" aria-current="page" href="${path}">`);
    });

    if (name === 'StaffStatisticsVisitors') {
      it('renders the charts loading fallback or the lazily loaded chart', function() {
        spyOn(AccessStore, 'isStaffOrSuperUser').and.returnValue(true);

        const html = renderToStaticMarkup(React.createElement(Component));
        const showsFallback = html.includes(Translator.t('staff_statistics_page.charts_loading'));
        const showsChart = html.includes('data-testid="statistics-visitors-chart"');

        // The lazy charts chunk is cached once resolved, so either state is valid here.
        expect(showsFallback || showsChart).toBeTrue();
      });
    }
  });
});
