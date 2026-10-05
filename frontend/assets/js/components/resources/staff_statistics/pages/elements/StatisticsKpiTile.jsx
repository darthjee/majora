const renderTitle = (label, href) => {
  if (!href) return label;

  return <a className="stretched-link text-reset text-decoration-none" href={href}>{label}</a>;
};

/**
 * KPI tile of the access statistics tabs (issues #1504, #1510).
 *
 * @description A Bootstrap card in a responsive column (full width, two then three per row).
 *   When `href` is given the whole card is clickable through a stretched link to it;
 *   otherwise the label is plain text. The label is a muted title and the value a large
 *   number; `children` hold optional secondary lines.
 * @param {object} props - Component props.
 * @param {string} props.label - Tile title.
 * @param {string} props.value - Already formatted main value.
 * @param {string} [props.href] - Hash path the tile links to (e.g. `#/staff/statistics/visits`).
 * @param {string} props.testId - `data-testid` of the card (the value gets `${testId}-value`).
 * @param {React.ReactNode} [props.children] - Secondary lines below the value.
 * @returns {React.ReactElement} Rendered tile.
 */
export default function StatisticsKpiTile({
  label, value, href, testId, children,
}) {
  return (
    <div className="col-12 col-sm-6 col-lg-4 mb-3">
      <div className="card position-relative h-100" data-testid={testId}>
        <div className="card-body">
          <h3 className="card-title h6 text-muted">
            {renderTitle(label, href)}
          </h3>
          <p className="display-6 mb-1" data-testid={`${testId}-value`}>{value}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
