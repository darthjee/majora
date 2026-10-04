import Translator from '../../../../i18n/Translator.js';
import StaffStatisticsAccessGate from './elements/StaffStatisticsAccessGate.jsx';
import StaffStatisticsCharts from './elements/StaffStatisticsCharts.jsx';
import StaffStatisticsPlaceholder from './elements/StaffStatisticsPlaceholder.jsx';
import StaffStatisticsShell from './elements/StaffStatisticsShell.jsx';

/**
 * Access statistics Visitors tab page.
 *
 * @returns {React.ReactElement} The Visitors tab page.
 */
export default function StaffStatisticsVisitors() {
  return (
    <StaffStatisticsAccessGate>
      <StaffStatisticsShell tab="visitors">
        <StaffStatisticsPlaceholder />
        <StaffStatisticsCharts
          chart="TimeSeriesChart"
          name="visitors"
          points={[]}
          xKey="date"
          series={[{
            dataKey: 'visitors',
            color: 'var(--majora-chart-1)',
            label: Translator.t('staff_statistics_page.tabs.visitors'),
          }]}
        />
      </StaffStatisticsShell>
    </StaffStatisticsAccessGate>
  );
}
