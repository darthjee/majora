/**
 * Generic row cells of the staff copy source list, used for copy types without a registered
 * row component (see `StaffCopyRows`).
 *
 * @param {object} props - Component props.
 * @param {{name: string}} props.row - The source row.
 * @returns {React.ReactElement} The name cell.
 */
export default function StaffCopyFallbackRow({ row }) {
  return <td>{row.name}</td>;
}
