import { useEffect, useMemo, useState } from 'react';
import StaffStatisticsFiltersController from './controllers/StaffStatisticsFiltersController.js';
import StaffStatisticsFilterBarHelper from './helpers/StaffStatisticsFilterBarHelper.jsx';

/**
 * Filter bar shared by every access statistics tab.
 *
 * @description Its state is the URL query: the filters are read from the hash on mount and
 *   every applied change navigates to `statisticsHref(tabPath, nextFilters)`, which remounts
 *   the page. Only the pending range select value and custom date inputs live in local state.
 * @param {object} props - Component props.
 * @param {string} props.tabPath - Hash path of the current tab (e.g. `#/staff/statistics`).
 * @param {string} [props.resolvedGranularity] - Granularity the API resolved (`day` / `week` /
 *   `month`), shown next to "Auto".
 * @returns {React.ReactElement} Rendered filter bar.
 */
export default function StaffStatisticsFilterBar({ tabPath, resolvedGranularity }) {
  const filters = useMemo(() => StaffStatisticsFiltersController.currentFilters(), []);
  const initial = useMemo(() => StaffStatisticsFiltersController.initialState(filters), [filters]);
  const [rangeDraft, setRangeDraft] = useState(initial.rangeDraft);
  const [customFrom, setCustomFrom] = useState(initial.customFrom);
  const [customTo, setCustomTo] = useState(initial.customTo);
  const [domains, setDomains] = useState([]);

  const controller = useMemo(() => new StaffStatisticsFiltersController({
    tabPath, setRangeDraft, setCustomFrom, setCustomTo, setDomains,
  }), [tabPath]);

  useEffect(() => {
    let active = true;
    controller.fetchDomains(() => active);
    return () => { active = false; };
  }, [controller]);

  return StaffStatisticsFilterBarHelper.render(
    {
      filters, rangeDraft, customFrom, customTo, domains, resolvedGranularity,
    },
    {
      onRangeChange: (range) => controller.handleRangeChange(filters, range),
      onCustomDateChange: (field, value) => controller.handleCustomDateChange(
        filters, { from: customFrom, to: customTo }, field, value,
      ),
      onChange: (key, value) => controller.handleChange(filters, key, value),
      onReset: () => controller.handleReset(),
    },
  );
}
