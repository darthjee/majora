/**
 * Rendering helper for {@link TwoColumnLayout}: factors out the `row`/`col-6` two-column
 * pattern duplicated across the resource-exchange tab helpers (`BuyTreasureTabHelper`,
 * `AcquireItemTabHelper`, and 6 others under
 * `character/pages/elements/tabs/helpers/`, issue #827/#988) so new consumers (starting with the
 * give-item modal) don't have to hand-roll the same `browsePane`/`detailPane` split.
 */
export default class TwoColumnLayoutHelper {
  /**
   * Renders `browsePane` alone (single column) when `detailPane` is `null`/absent, otherwise
   * wraps both panes in a Bootstrap `row`/`col-6` layout.
   *
   * @param {React.ReactNode} browsePane - Left-column content, always rendered.
   * @param {React.ReactNode} [detailPane] - Right-column content; when `null`/absent, only
   *   `browsePane` is rendered (no row/columns at all).
   * @returns {React.ReactElement} Rendered layout.
   */
  static render(browsePane, detailPane) {
    if (!detailPane) {
      return browsePane;
    }

    return (
      <div className="row">
        <div className="col-6">{browsePane}</div>
        <div className="col-6">{detailPane}</div>
      </div>
    );
  }
}
