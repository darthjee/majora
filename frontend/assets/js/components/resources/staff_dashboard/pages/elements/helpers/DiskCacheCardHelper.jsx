import React from 'react';
import DashboardCard from '../DashboardCard.jsx';
import CardTop from '../CardTop.jsx';
import CardActions from '../CardActions.jsx';
import SizeDisplay from '../SizeDisplay.jsx';
import Icons from '../../../../../../utils/ui/Icons.js';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Rendering helper for the DiskCacheCard element.
 */
export default class DiskCacheCardHelper {
  /**
   * Render the disk-cache card: title + size data, Clear Cache/Refresh
   * actions, and any success/error feedback below the card.
   *
   * @param {{size: (number|null), status: string, loading: boolean, error: boolean}} state -
   *   Card state.
   * @param {{onClearCache: Function, onRefresh: Function}} handlers - Event handlers.
   * @returns {React.ReactElement} The rendered disk-cache card.
   */
  static render(state, handlers) {
    return (
      <DashboardCard
        top={(
          <CardTop
            title={Translator.t('staff_dashboard.disk_cache_title')}
            data={DiskCacheCardHelper.#renderData(state)}
          />
        )}
        actions={(
          <>
            <CardActions actions={DiskCacheCardHelper.#buildActions(state, handlers)} />
            {DiskCacheCardHelper.#renderFeedback(state)}
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
        tooltip: Translator.t('staff_dashboard.clear_cache_tooltip'),
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

    if (state.error) {
      return <span className="text-danger">{Translator.t('staff_dashboard.disk_cache_load_error')}</span>;
    }

    return <SizeDisplay value={state.size} valueType="bytes" />;
  }

  static #renderFeedback(state) {
    if (state.status === 'success') {
      return <p className="text-success mt-2 mb-0 text-center">{Translator.t('staff_dashboard.clear_cache_success')}</p>;
    }

    if (state.status === 'error') {
      return <p className="text-danger mt-2 mb-0 text-center">{Translator.t('staff_dashboard.clear_cache_error')}</p>;
    }

    if (state.error) {
      return <p className="text-danger mt-2 mb-0 text-center">{Translator.t('staff_dashboard.disk_cache_load_error')}</p>;
    }

    return null;
  }
}
