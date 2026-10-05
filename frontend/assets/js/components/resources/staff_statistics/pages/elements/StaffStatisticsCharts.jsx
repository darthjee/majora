import React, { Suspense } from 'react';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Builds the component that renders a chart picked by name from the charts chunk.
 *
 * @description Maps the named exports of the charts chunk to a single default
 *   component, so every chart shares one lazily loaded chunk.
 * @param {object} module - The loaded charts chunk module (named chart exports).
 * @returns {{default: Function}} Module-like object for `React.lazy`.
 */
function buildLazyChart(module) {
  return {
    default: function LazyChart({ chart, ...props }) {
      const Chart = module[chart];

      return <Chart {...props} />;
    },
  };
}

const Charts = React.lazy(() => import('../../charts/index.js').then(buildLazyChart));

/**
 * Lazy entry point into the access statistics charts chunk.
 *
 * @description Renders the chart named by `chart` from the lazily loaded charts
 *   chunk, showing a loading message while the chunk is being fetched.
 * @param {object} props - Component props.
 * @param {string} props.chart - Name of the chart export (e.g. `'TimeSeriesChart'`).
 * @param {...*} props.chartProps - Remaining props, passed to the chart.
 * @returns {React.ReactElement} The suspended chart.
 */
export default function StaffStatisticsCharts({ chart, ...chartProps }) {
  return (
    <Suspense fallback={<LoadingMessage message={Translator.t('staff_statistics_page.charts_loading')} />}>
      <Charts chart={chart} {...chartProps} />
    </Suspense>
  );
}
