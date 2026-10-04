import RequestStore from '../../../../../../utils/requests/RequestStore.js';
import HashRouteResolver from '../../../../../../utils/routing/HashRouteResolver.js';
import StatisticsFilters from '../../helpers/StatisticsFilters.js';
import statisticsHref from '../../helpers/statisticsHref.js';

/**
 * Sets the window location hash, SSR-safe.
 *
 * @param {string} hash - Hash to navigate to.
 * @returns {void}
 */
function setWindowHash(hash) {
  if (typeof window !== 'undefined') window.location.hash = hash;
}

/**
 * Drives the access statistics filter bar: its state is the URL, so every applied change
 * navigates to a new hash (which remounts the page).
 */
export default class StaffStatisticsFiltersController {
  /**
   * Creates a filters controller.
   *
   * @param {object} args - Arguments.
   * @param {string} args.tabPath - Hash path of the current tab (e.g. `#/staff/statistics`).
   * @param {Function} args.setRangeDraft - Setter of the range select's pending value.
   * @param {Function} args.setCustomFrom - Setter of the pending custom `from` input.
   * @param {Function} args.setCustomTo - Setter of the pending custom `to` input.
   * @param {Function} [args.setDomains] - Setter of the domain options list.
   * @param {Function} [args.navigate] - Navigation function (defaults to setting
   *   `window.location.hash`).
   */
  constructor({
    tabPath, setRangeDraft, setCustomFrom, setCustomTo, setDomains, navigate = setWindowHash,
  }) {
    this.tabPath = tabPath;
    this.setRangeDraft = setRangeDraft;
    this.setCustomFrom = setCustomFrom;
    this.setCustomTo = setCustomTo;
    this.setDomains = setDomains;
    this.navigate = navigate;
  }

  /**
   * Reads the current filters from the hash.
   *
   * @param {HashRouteResolver} [resolver] - Hash resolver to read from.
   * @returns {object} The normalized filters (see `StatisticsFilters.fromParams`).
   */
  static currentFilters(resolver = new HashRouteResolver()) {
    return StatisticsFilters.fromParams(resolver.getFilterParams());
  }

  /**
   * Builds the initial local state of the filter bar.
   *
   * @description The custom date inputs start from the current range's resolved dates, so
   *   switching from a preset to "custom" pre-fills them.
   * @param {object} filters - Current filters.
   * @param {string} [today] - Today as `YYYY-MM-DD` (defaults to the browser's local date).
   * @returns {{rangeDraft: string, customFrom: string, customTo: string}} Initial local state.
   */
  static initialState(filters, today = StatisticsFilters.today()) {
    const { from, to } = StatisticsFilters.resolveDates(filters, today);
    return { rangeDraft: filters.range, customFrom: from, customTo: to };
  }

  /**
   * Builds the effect loading the domain options.
   *
   * @returns {Function} Effect callback returning its cleanup (which drops a late response).
   */
  buildDomainsEffect() {
    return () => {
      let active = true;
      this.fetchDomains(() => active);
      return () => { active = false; };
    };
  }

  /**
   * Fetches the domain options.
   *
   * @param {Function} [isActive] - Returns `false` once the component unmounted.
   * @returns {Promise<void>} Resolves once the domains were set (an empty list on failure).
   */
  fetchDomains(isActive = () => true) {
    return RequestStore.ensure({
      componentName: 'StaffStatisticsFilterBar',
      resource: 'staffStatistics',
      quantityType: 'domains',
    })
      .then(({ data }) => (Array.isArray(data) ? data : []))
      .catch(() => [])
      .then((domains) => {
        if (isActive()) this.setDomains(domains);
      });
  }

  /**
   * Handles a date range select change.
   *
   * @description A preset applies at once; "custom" only reveals the date inputs, applied
   *   once both dates are valid.
   * @param {object} filters - Current filters.
   * @param {string} range - Selected range.
   * @returns {void}
   */
  handleRangeChange(filters, range) {
    this.setRangeDraft(range);
    if (range === 'custom') return;

    this.apply(filters, { range, from: null, to: null });
  }

  /**
   * Handles a custom date input change.
   *
   * @param {object} filters - Current filters.
   * @param {{from: string, to: string}} draft - Current pending custom dates.
   * @param {string} field - `from` or `to`.
   * @param {string} value - New date value.
   * @returns {void}
   */
  handleCustomDateChange(filters, draft, field, value) {
    const next = { ...draft, [field]: value };
    (field === 'from' ? this.setCustomFrom : this.setCustomTo)(value);

    if (StatisticsFilters.isValidRange(next.from, next.to)) {
      this.apply(filters, { range: 'custom', from: next.from, to: next.to });
    }
  }

  /**
   * Handles a change of a single-value filter (`user`, `domain`, `audience`, `granularity`).
   *
   * @param {object} filters - Current filters.
   * @param {string} key - Filter key.
   * @param {string|null} value - New value; `''` / `null` mean "any".
   * @returns {void}
   */
  handleChange(filters, key, value) {
    this.apply(filters, { [key]: value === '' ? null : value });
  }

  /**
   * Clears every filter, navigating to the bare tab path.
   *
   * @returns {void}
   */
  handleReset() {
    this.navigate(this.tabPath);
  }

  /**
   * Navigates to the tab path carrying the merged filters.
   *
   * @param {object} filters - Current filters.
   * @param {object} changes - Filter changes to apply.
   * @returns {void}
   */
  apply(filters, changes) {
    this.navigate(statisticsHref(this.tabPath, { ...filters, ...changes }));
  }
}
