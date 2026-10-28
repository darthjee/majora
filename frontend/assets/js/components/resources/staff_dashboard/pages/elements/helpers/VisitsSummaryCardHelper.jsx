import React from 'react';
import DashboardCard from '../DashboardCard.jsx';
import CardTop from '../CardTop.jsx';
import CardActions from '../CardActions.jsx';
import Icons from '../../../../../../utils/ui/Icons.js';
import Translator from '../../../../../../i18n/Translator.js';

const PERIODS = ['day', 'week', 'month'];
const PERIOD_SELECT_ID = 'visits-summary-period';

/**
 * Rendering helper for the VisitsSummaryCard element (issue #1685).
 */
export default class VisitsSummaryCardHelper {
  /**
   * Render the visits-summary card: title + unique-visitors count, the period select, the
   * statistics link, Clear/Refresh actions and any clear feedback.
   *
   * @param {{summary: ?number, status: (string|object), loading: boolean, error: boolean,
   *   period: string}} state - Card state.
   * @param {{onPeriodChange: Function, onClear: Function, onRefresh: Function}} handlers -
   *   Event handlers.
   * @returns {React.ReactElement} The rendered visits-summary card.
   */
  static render(state, handlers) {
    const disabled = VisitsSummaryCardHelper.#isBusy(state);

    return (
      <DashboardCard
        top={(
          <>
            <CardTop
              title={Translator.t('staff_dashboard.visits_summary_title')}
              data={VisitsSummaryCardHelper.#renderData(state)}
            />
            {VisitsSummaryCardHelper.#renderPeriodSelect(state.period, disabled, handlers.onPeriodChange)}
            <div className="text-center mb-3">
              <a href="#/staff/statistics">{Translator.t('staff_dashboard.visits_statistics_link')}</a>
            </div>
          </>
        )}
        actions={(
          <>
            <CardActions actions={VisitsSummaryCardHelper.#buildActions(disabled, handlers)} />
            {VisitsSummaryCardHelper.#renderFeedback(state.status)}
          </>
        )}
      />
    );
  }

  static #isBusy(state) {
    return state.loading || state.status === 'loading';
  }

  static #renderPeriodSelect(period, disabled, onChange) {
    return (
      <div className="mb-3">
        <label className="form-label small" htmlFor={PERIOD_SELECT_ID}>
          {Translator.t('staff_dashboard.visits_period_label')}
        </label>
        <select
          id={PERIOD_SELECT_ID}
          className="form-select form-select-sm"
          value={period}
          disabled={disabled}
          onChange={onChange}
        >
          {PERIODS.map((value) => (
            <option key={value} value={value}>
              {Translator.t(`staff_dashboard.visits_period_${value}`)}
            </option>
          ))}
        </select>
      </div>
    );
  }

  static #buildActions(disabled, handlers) {
    return [
      {
        icon: Icons.trash,
        tooltip: Translator.t('staff_dashboard.visits_clear_tooltip'),
        onClick: handlers.onClear,
        disabled,
      },
      {
        icon: Icons.arrowClockwise,
        tooltip: Translator.t('staff_dashboard.refresh_tooltip'),
        onClick: handlers.onRefresh,
        disabled,
      },
    ];
  }

  static #renderData(state) {
    if (state.loading) {
      return <span className="text-muted">{Translator.t('staff_dashboard.loading')}</span>;
    }

    if (state.error || state.summary === null) {
      return <span className="text-danger">{Translator.t('staff_dashboard.visits_summary_load_error')}</span>;
    }

    return <span>{state.summary}</span>;
  }

  static #renderFeedback(status) {
    if (status?.state === 'success') {
      const message = Translator.t('staff_dashboard.visits_clear_success')
        .replace('{{visits}}', status.deletedVisits)
        .replace('{{sessions}}', status.deletedSessions);

      return <p className="text-success mt-2 mb-0 text-center">{message}</p>;
    }

    if (status === 'error') {
      return <p className="text-danger mt-2 mb-0 text-center">{Translator.t('staff_dashboard.visits_clear_error')}</p>;
    }

    return null;
  }
}
