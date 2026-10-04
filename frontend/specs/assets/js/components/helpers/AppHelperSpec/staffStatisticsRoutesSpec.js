import AppHelper from '../../../../../../assets/js/components/helpers/AppHelper.jsx';
import StaffStatistics from '../../../../../../assets/js/components/resources/staff_statistics/pages/StaffStatistics.jsx';
import StaffStatisticsVisits from '../../../../../../assets/js/components/resources/staff_statistics/pages/StaffStatisticsVisits.jsx';
import StaffStatisticsVisitors from '../../../../../../assets/js/components/resources/staff_statistics/pages/StaffStatisticsVisitors.jsx';
import StaffStatisticsDuration from '../../../../../../assets/js/components/resources/staff_statistics/pages/StaffStatisticsDuration.jsx';
import StaffStatisticsDomains from '../../../../../../assets/js/components/resources/staff_statistics/pages/StaffStatisticsDomains.jsx';
import StaffStatisticsUsers from '../../../../../../assets/js/components/resources/staff_statistics/pages/StaffStatisticsUsers.jsx';
import StaffStatisticsVisitList from '../../../../../../assets/js/components/resources/staff_statistics/pages/StaffStatisticsVisitList.jsx';

const CASES = [
  ['staffStatistics', StaffStatistics],
  ['staffStatisticsVisits', StaffStatisticsVisits],
  ['staffStatisticsVisitors', StaffStatisticsVisitors],
  ['staffStatisticsDuration', StaffStatisticsDuration],
  ['staffStatisticsDomains', StaffStatisticsDomains],
  ['staffStatisticsUsers', StaffStatisticsUsers],
  ['staffStatisticsVisitList', StaffStatisticsVisitList],
];

describe('AppHelper access statistics pages', function() {
  const pageElement = (page) => {
    const header = AppHelper.render(page, '#/staff/statistics').props.children;
    const fragment = header.props.children;
    return fragment.props.children;
  };

  CASES.forEach(([page, Component]) => {
    it(`maps ${page} to its page component`, function() {
      expect(pageElement(page).type).toBe(Component);
    });
  });
});
