import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffStatisticsOverview from '../../../../../../../assets/js/components/resources/staff_statistics/pages/StaffStatisticsOverview.jsx';
import StaffStatisticsVisits from '../../../../../../../assets/js/components/resources/staff_statistics/pages/StaffStatisticsVisits.jsx';
import StaffStatisticsVisitors from '../../../../../../../assets/js/components/resources/staff_statistics/pages/StaffStatisticsVisitors.jsx';
import StaffStatisticsDuration from '../../../../../../../assets/js/components/resources/staff_statistics/pages/StaffStatisticsDuration.jsx';
import StaffStatisticsDomains from '../../../../../../../assets/js/components/resources/staff_statistics/pages/StaffStatisticsDomains.jsx';
import StaffStatisticsUsers from '../../../../../../../assets/js/components/resources/staff_statistics/pages/StaffStatisticsUsers.jsx';
import StaffStatisticsVisitList from '../../../../../../../assets/js/components/resources/staff_statistics/pages/StaffStatisticsVisitList.jsx';
import OverviewController
  from '../../../../../../../assets/js/components/resources/staff_statistics/pages/controllers/OverviewController.js';
import VisitsController
  from '../../../../../../../assets/js/components/resources/staff_statistics/pages/controllers/VisitsController.js';
import DurationController
  from '../../../../../../../assets/js/components/resources/staff_statistics/pages/controllers/DurationController.js';
import DomainsController
  from '../../../../../../../assets/js/components/resources/staff_statistics/pages/controllers/DomainsController.js';
import UsersController
  from '../../../../../../../assets/js/components/resources/staff_statistics/pages/controllers/UsersController.js';
import VisitorsController
  from '../../../../../../../assets/js/components/resources/staff_statistics/pages/controllers/VisitorsController.js';
import StaffStatisticsPageController
  from '../../../../../../../assets/js/components/resources/staff_statistics/pages/controllers/StaffStatisticsPageController.js';
import StaffStatisticsFilterBarHelper
  from '../../../../../../../assets/js/components/resources/staff_statistics/pages/elements/helpers/StaffStatisticsFilterBarHelper.jsx';
import AccessStore from '../../../../../../../assets/js/utils/access/store/AccessStore.js';
import Translator from '../../../../../../../assets/js/i18n/Translator.js';
import { stubBuildEffect } from '../../../../../../support/controllerStubs.js';

const PAGES = [
  ['StaffStatisticsOverview', StaffStatisticsOverview, '#/staff/statistics'],
  ['StaffStatisticsVisits', StaffStatisticsVisits, '#/staff/statistics/visits'],
  ['StaffStatisticsVisitors', StaffStatisticsVisitors, '#/staff/statistics/visitors'],
  ['StaffStatisticsDuration', StaffStatisticsDuration, '#/staff/statistics/duration'],
  ['StaffStatisticsDomains', StaffStatisticsDomains, '#/staff/statistics/domains'],
  ['StaffStatisticsUsers', StaffStatisticsUsers, '#/staff/statistics/users'],
  ['StaffStatisticsVisitList', StaffStatisticsVisitList, '#/staff/statistics/visit-list'],
];

const LOADING_KEYS = {
  StaffStatisticsOverview: 'staff_statistics_page.overview.loading',
  StaffStatisticsVisits: 'staff_statistics_page.charts_loading',
  StaffStatisticsVisitors: 'staff_statistics_page.charts_loading',
  StaffStatisticsDuration: 'staff_statistics_page.charts_loading',
  StaffStatisticsDomains: 'staff_statistics_page.charts_loading',
  StaffStatisticsUsers: 'staff_statistics_page.charts_loading',
};

PAGES.forEach(([name, Component, path]) => {
  describe(name, function() {
    let originalWindow;

    beforeEach(function() {
      originalWindow = globalThis.window;
      globalThis.window = { location: { hash: path } };
      stubBuildEffect(StaffStatisticsPageController);
      stubBuildEffect(OverviewController);
      stubBuildEffect(VisitsController);
      stubBuildEffect(VisitorsController);
      stubBuildEffect(DurationController);
      stubBuildEffect(DomainsController);
      stubBuildEffect(UsersController);
      spyOn(StaffStatisticsFilterBarHelper, 'render').and.returnValue(React.createElement('div'));
    });

    afterEach(function() {
      globalThis.window = originalWindow;
    });

    it('renders nothing before access is confirmed', function() {
      spyOn(AccessStore, 'isStaffOrSuperUser').and.returnValue(false);

      expect(renderToStaticMarkup(React.createElement(Component))).toBe('');
    });

    it('renders the shell with its tab active', function() {
      spyOn(AccessStore, 'isStaffOrSuperUser').and.returnValue(true);

      const html = renderToStaticMarkup(React.createElement(Component));

      expect(html).toContain(Translator.t('staff_statistics_page.title'));
      expect(html).toContain(`<a class="nav-link active" aria-current="page" href="${path}">`);
    });

    if (LOADING_KEYS[name]) {
      it('renders the loading state instead of the placeholder', function() {
        spyOn(AccessStore, 'isStaffOrSuperUser').and.returnValue(true);

        const html = renderToStaticMarkup(React.createElement(Component));

        expect(html).toContain(Translator.t(LOADING_KEYS[name]));
        expect(html).not.toContain(Translator.t('staff_statistics_page.placeholder'));
      });
    } else {
      it('renders the placeholder', function() {
        spyOn(AccessStore, 'isStaffOrSuperUser').and.returnValue(true);

        const html = renderToStaticMarkup(React.createElement(Component));

        expect(html).toContain(Translator.t('staff_statistics_page.placeholder'));
      });
    }
  });
});
