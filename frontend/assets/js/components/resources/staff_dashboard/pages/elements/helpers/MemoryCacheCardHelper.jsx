import React from 'react';
import DashboardCard from '../DashboardCard.jsx';
import CardTop from '../CardTop.jsx';
import CardActions from '../CardActions.jsx';
import PercentageDisplay from '../PercentageDisplay.jsx';
import Icons from '../../../../../../utils/ui/Icons.js';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Rendering helper for the MemoryCacheCard element.
 */
export default class MemoryCacheCardHelper {
  /**
   * Render the memory-cache card: title + percentage data, Clear Cache/Refresh
   * actions, and any success/error feedback below the card.
   *
   * @param {{summary: (object|null), status: string, loading: boolean, error: boolean}} state -
   *   Card state.
   * @param {{onClearCache: Function, onRefresh: Function, onDataClick: Function}} handlers -
   *   Event handlers.
   * @returns {React.ReactElement} The rendered memory-cache card.
   */
  static render(state, handlers) {
    return (
      <DashboardCard
        top={(
          <CardTop
            title={Translator.t('staff_dashboard.memory_cache_title')}
            data={MemoryCacheCardHelper.#renderData(state)}
            onDataClick={handlers.onDataClick}
          />
        )}
        actions={(
          <>
            <CardActions actions={MemoryCacheCardHelper.#buildActions(state, handlers)} />
            {MemoryCacheCardHelper.#renderFeedback(state)}
          </>
        )}
      />
    );
  }

  static #buildActions(state, handlers) {
    const disabled = state.status === 'loading';

    return [
      {
        icon: Icons.databaseFillDash,
        tooltip: Translator.t('staff_dashboard.clear_cache_tooltip'),
        onClick: handlers.onClearCache,
        disabled,
      },
      {
        icon: Icons.databaseFillDash,
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

    if (state.error || !state.summary) {
      return <span className="text-danger">{Translator.t('staff_dashboard.summary_load_error')}</span>;
    }

    return <PercentageDisplay value={state.summary.size} limit={state.summary.limit} thresholds={undefined} />;
  }

  static #renderFeedback(state) {
    if (state.status === 'success') {
      return <p className="text-success mt-2 mb-0 text-center">{Translator.t('staff_dashboard.clear_cache_success')}</p>;
    }

    if (state.status === 'error') {
      return <p className="text-danger mt-2 mb-0 text-center">{Translator.t('staff_dashboard.clear_cache_error')}</p>;
    }

    if (state.error) {
      return <p className="text-danger mt-2 mb-0 text-center">{Translator.t('staff_dashboard.summary_load_error')}</p>;
    }

    return null;
  }
}
