/**
 * Labelled line of the Visit list session tracking cells (issue #1714).
 *
 * @description A small line with a muted label followed by its value.
 * @param {object} props - Component props.
 * @param {string} props.label - The translated label.
 * @param {React.ReactNode} props.children - The value.
 * @returns {React.ReactElement} The rendered line.
 */
export default function StatisticsVisitDetail({ label, children }) {
  return (
    <div className="small text-nowrap">
      <span className="text-muted">{`${label}: `}</span>
      {children}
    </div>
  );
}
