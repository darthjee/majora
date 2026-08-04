import React from 'react';
import DashboardCard from '../DashboardCard.jsx';
import CardTop from '../CardTop.jsx';
import SizeDisplay from '../SizeDisplay.jsx';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Rendering helper for the DiskCacheCard element.
 */
export default class DiskCacheCardHelper {
  /**
   * Render the disk-cache card: title + size data, no actions.
   *
   * @param {{size: (number|null), loading: boolean, error: boolean}} state - Card state.
   * @returns {React.ReactElement} The rendered disk-cache card.
   */
  static render(state) {
    return (
      <DashboardCard
        top={(
          <CardTop
            title={Translator.t('staff_dashboard.disk_cache_title')}
            data={DiskCacheCardHelper.#renderData(state)}
          />
        )}
        actions={null}
      />
    );
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
}
