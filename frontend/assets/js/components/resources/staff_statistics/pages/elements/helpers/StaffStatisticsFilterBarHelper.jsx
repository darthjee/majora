import { Fragment } from 'react';
import Form from 'react-bootstrap/cjs/Form.js';
import Translator from '../../../../../../i18n/Translator.js';
import StaffStatisticsUserSelect from '../StaffStatisticsUserSelect.jsx';
import {
  AUDIENCES, GRANULARITIES, RANGES, UNKNOWN_DOMAIN,
} from '../../helpers/StatisticsFilters.js';

const ID_PREFIX = 'statistics-filter';
const RESOLVED_GRANULARITIES = GRANULARITIES.filter((granularity) => granularity !== 'auto');

/**
 * Translates a filter key of the `staff_statistics_page` namespace.
 *
 * @param {string} key - Key under `staff_statistics_page.filters`.
 * @returns {string} The translated text.
 */
function t(key) {
  return Translator.t(`staff_statistics_page.filters.${key}`);
}

/**
 * Rendering helper for the `StaffStatisticsFilterBar` element.
 */
export default class StaffStatisticsFilterBarHelper {
  /**
   * Renders the date range, user, domain, audience and granularity controls plus Reset.
   *
   * @param {{filters: object, rangeDraft: string, customFrom: string, customTo: string,
   *   domains: Array<{id: number, domain: string}>, resolvedGranularity: (string|undefined),
   *   showGranularity: (boolean|undefined)}} state - Current URL filters, pending range /
   *   custom dates, domain options, the resolved granularity and whether to show the
   *   granularity select (hidden only when `false`).
   * @param {{onRangeChange: Function, onCustomDateChange: Function, onChange: Function,
   *   onReset: Function}} handlers - Range select, custom date (`(field, value)`), single
   *   filter (`(key, value)`) and reset handlers.
   * @returns {React.ReactElement} Rendered filter bar.
   */
  static render(state, handlers) {
    return (
      <div className="row g-2 align-items-end mb-3" data-testid="statistics-filter-bar">
        {StaffStatisticsFilterBarHelper.#renderRange(state, handlers)}
        {StaffStatisticsFilterBarHelper.#renderCustomDates(state, handlers)}
        {StaffStatisticsFilterBarHelper.#renderField('user', (
          <StaffStatisticsUserSelect
            id={`${ID_PREFIX}-user`}
            value={state.filters.user}
            onChange={(value) => handlers.onChange('user', value)}
          />
        ))}
        {StaffStatisticsFilterBarHelper.#renderDomain(state, handlers)}
        {StaffStatisticsFilterBarHelper.#renderSelect('audience', state.filters.audience, handlers, AUDIENCES.map(
          (audience) => [audience, t(`audiences.${audience}`)],
        ))}
        {StaffStatisticsFilterBarHelper.#renderGranularity(state, handlers)}
        <div className="col-auto">
          <button
            type="button"
            className="btn btn-outline-secondary"
            data-testid={`${ID_PREFIX}-reset`}
            onClick={handlers.onReset}
          >
            {t('reset')}
          </button>
        </div>
      </div>
    );
  }

  static #renderField(key, control) {
    return (
      <div className="col-auto">
        <Form.Label htmlFor={`${ID_PREFIX}-${key}`}>{t(key)}</Form.Label>
        {control}
      </div>
    );
  }

  static #renderSelect(key, value, handlers, options) {
    return StaffStatisticsFilterBarHelper.#renderField(key, (
      <Form.Select
        id={`${ID_PREFIX}-${key}`}
        data-testid={`${ID_PREFIX}-${key}`}
        value={value ?? ''}
        onChange={(event) => handlers.onChange(key, event.target.value)}
      >
        {options.map(([optionValue, label]) => (
          <option key={optionValue} value={optionValue}>{label}</option>
        ))}
      </Form.Select>
    ));
  }

  static #renderRange(state, handlers) {
    return StaffStatisticsFilterBarHelper.#renderField('range', (
      <Form.Select
        id={`${ID_PREFIX}-range`}
        data-testid={`${ID_PREFIX}-range`}
        value={state.rangeDraft}
        onChange={(event) => handlers.onRangeChange(event.target.value)}
      >
        {RANGES.map((range) => (
          <option key={range} value={range}>{t(`ranges.${range}`)}</option>
        ))}
      </Form.Select>
    ));
  }

  static #renderCustomDates(state, handlers) {
    if (state.rangeDraft !== 'custom') return null;

    return ['from', 'to'].map((field) => (
      <Fragment key={field}>
        {StaffStatisticsFilterBarHelper.#renderField(field, (
          <Form.Control
            id={`${ID_PREFIX}-${field}`}
            data-testid={`${ID_PREFIX}-${field}`}
            type="date"
            value={field === 'from' ? state.customFrom : state.customTo}
            onChange={(event) => handlers.onCustomDateChange(field, event.target.value)}
          />
        ))}
      </Fragment>
    ));
  }

  static #renderDomain(state, handlers) {
    const options = [
      ['', t('domain_any')],
      ...state.domains.map((domain) => [String(domain.id), domain.domain]),
      [UNKNOWN_DOMAIN, t('domain_unknown')],
    ];

    return StaffStatisticsFilterBarHelper.#renderSelect('domain', state.filters.domain, handlers, options);
  }

  static #renderGranularity(state, handlers) {
    if (state.showGranularity === false) return null;

    return StaffStatisticsFilterBarHelper.#renderSelect('granularity', state.filters.granularity, handlers, GRANULARITIES.map(
      (granularity) => [granularity, StaffStatisticsFilterBarHelper.#granularityLabel(granularity, state)],
    ));
  }

  static #granularityLabel(granularity, { resolvedGranularity }) {
    const label = t(`granularities.${granularity}`);
    const resolved = RESOLVED_GRANULARITIES.includes(resolvedGranularity);
    if (granularity !== 'auto' || !resolved) return label;

    return `${label} (${t(`granularities.${resolvedGranularity}`)})`;
  }
}
