/**
 * Renders its children when `render` is truthy, `null` otherwise.
 *
 * @param {object} props - Component props.
 * @param {boolean} props.render - Whether the children should be rendered.
 * @param {React.ReactNode} props.children - Content rendered when `render` is truthy.
 * @returns {React.ReactNode} The children, or `null` when `render` is falsy.
 */
export default function ConditionalComponent({ render, children }) {
  return render ? children : null;
}
