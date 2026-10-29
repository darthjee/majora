import Translator from '../../../../../i18n/Translator.js';

const PATH_STYLE = Object.freeze({ maxWidth: '16rem' });

/**
 * Path value of the Visit list session tracking columns (issue #1714).
 *
 * @description Renders the path as-is (a route pattern or `unresolved`) in a monospace,
 *   truncated inline block with a fixed max width, the full value in its `title`. A `null`
 *   path (a row from before the tracking columns) renders the translated "unknown" label.
 * @param {object} props - Component props.
 * @param {?string} props.value - The path, or `null` when unknown.
 * @returns {React.ReactElement} The rendered path value.
 */
export default function StatisticsPathValue({ value }) {
  if (value === null || value === undefined) {
    return <span>{Translator.t('staff_statistics_page.visit_list.unknown')}</span>;
  }

  return (
    <span className="font-monospace text-truncate d-inline-block align-bottom" style={PATH_STYLE} title={value}>
      {value}
    </span>
  );
}
