import TwoColumnLayoutHelper from './helpers/TwoColumnLayoutHelper.jsx';

/**
 * Shared two-column layout: renders `browsePane` alone until `detailPane` is supplied, then
 * lays both out side by side (Bootstrap `row`/`col-6`). Extracted from the resource-exchange
 * tabs' duplicated single/two-column pattern (issue #827); the give-item modal is its first
 * consumer, retrofitting the existing tabs onto this component is tracked separately (#988).
 *
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.browsePane - Left-column content, always rendered.
 * @param {React.ReactNode} [props.detailPane] - Right-column content; when `null`/absent, only
 *   `browsePane` is rendered (no row/columns at all).
 * @returns {React.ReactElement} Rendered layout.
 */
export default function TwoColumnLayout({ browsePane, detailPane = null }) {
  return TwoColumnLayoutHelper.render(browsePane, detailPane);
}
