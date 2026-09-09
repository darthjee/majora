import React from 'react';
import DashboardCard from '../DashboardCard.jsx';
import CardTop from '../CardTop.jsx';
import CardActions from '../CardActions.jsx';
import Icons from '../../../../../../utils/ui/Icons.js';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Rendering helper for the CrawlerDebugCard element.
 */
export default class CrawlerDebugCardHelper {
  /**
   * Render the crawler debug card: title + per-type counts, Clear/Refresh
   * actions, and any success/error feedback below the card.
   *
   * @param {{counts: (object|null), status: string, loading: boolean, error: boolean}} state -
   *   Card state.
   * @param {{onClearCache: Function, onRefresh: Function}} handlers - Event handlers.
   * @returns {React.ReactElement} The rendered crawler debug card.
   */
  static render(state, handlers) {
    return (
      <DashboardCard
        top={(
          <CardTop
            title={Translator.t('staff_dashboard.crawler_debug_title')}
            data={CrawlerDebugCardHelper.#renderData(state)}
          />
        )}
        actions={(
          <>
            <CardActions actions={CrawlerDebugCardHelper.#buildActions(state, handlers)} />
            {CrawlerDebugCardHelper.#renderFeedback(state)}
          </>
        )}
      />
    );
  }

  static #buildActions(state, handlers) {
    const disabled = state.status === 'loading';

    return [
      {
        icon: Icons.trash,
        tooltip: Translator.t('staff_dashboard.crawler_clear_tooltip'),
        onClick: handlers.onClearCache,
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

    if (state.error || !state.counts) {
      return <span className="text-danger">{Translator.t('staff_dashboard.crawler_summary_load_error')}</span>;
    }

    if (Object.keys(state.counts).length === 0) {
      return <span className="text-muted">{Translator.t('staff_dashboard.crawler_summary_empty')}</span>;
    }

    return CrawlerDebugCardHelper.#renderCounts(state.counts);
  }

  static #renderCounts(counts) {
    const types = Object.keys(counts).sort();
    const total = Object.values(counts).reduce((sum, value) => sum + value, 0);

    return (
      <span className="d-inline-block small text-start">
        {types.map((type) => (
          <span key={type} className="d-flex justify-content-between gap-3">
            <span>{type}</span>
            <span>{counts[type]}</span>
          </span>
        ))}
        <span className="d-flex justify-content-between gap-3 fw-bold border-top">
          <span>{Translator.t('staff_dashboard.crawler_summary_total')}</span>
          <span>{total}</span>
        </span>
      </span>
    );
  }

  static #renderFeedback(state) {
    if (state.status === 'success') {
      return <p className="text-success mt-2 mb-0 text-center">{Translator.t('staff_dashboard.crawler_clear_success')}</p>;
    }

    if (state.status === 'error') {
      return <p className="text-danger mt-2 mb-0 text-center">{Translator.t('staff_dashboard.crawler_clear_error')}</p>;
    }

    if (state.error) {
      return <p className="text-danger mt-2 mb-0 text-center">{Translator.t('staff_dashboard.crawler_summary_load_error')}</p>;
    }

    return null;
  }
}
