import { useMemo } from 'react';
import Translator from '../../../../../i18n/Translator.js';
import StatisticsTabs from '../helpers/StatisticsTabs.js';
import StaffStatisticsFiltersController from './controllers/StaffStatisticsFiltersController.js';
import StaffStatisticsFilterBar from './StaffStatisticsFilterBar.jsx';
import StaffStatisticsTabs from './StaffStatisticsTabs.jsx';

/**
 * Shared layout of every access statistics tab: title, filter bar, tab nav, then the body.
 *
 * @param {object} props - Component props.
 * @param {string} props.tab - Active tab key (`overview`, `visits`, `visitors`, `duration`,
 *   `domains`, `users` or `visit_list`).
 * @param {string} [props.resolvedGranularity] - Granularity the API resolved (the response's
 *   `filters.granularity`), shown next to "Auto" in the filter bar.
 * @param {boolean} [props.showGranularity] - Whether the filter bar shows the granularity
 *   select (default `true`).
 * @param {React.ReactNode} props.children - Tab body.
 * @returns {React.ReactElement} Rendered shell.
 */
export default function StaffStatisticsShell({
  tab, resolvedGranularity, showGranularity = true, children,
}) {
  const filters = useMemo(() => StaffStatisticsFiltersController.currentFilters(), []);

  return (
    <div className="container mt-4" data-testid="staff-statistics">
      <h1>{Translator.t('staff_statistics_page.title')}</h1>
      <StaffStatisticsFilterBar
        tabPath={StatisticsTabs.hashPath(tab)}
        resolvedGranularity={resolvedGranularity}
        showGranularity={showGranularity}
      />
      <StaffStatisticsTabs activeTab={StatisticsTabs.find(tab).key} filters={filters} />
      {children}
    </div>
  );
}
