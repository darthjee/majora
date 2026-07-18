import SeeAllCardHelper from './helpers/SeeAllCardHelper.jsx';

/**
 * Shared grid-cell card appended to the end of a preview card grid (e.g.
 * Treasures, Photos), matching the surrounding cards' shape but showing a
 * centered bootstrap icon instead of a photo. The whole card links to the
 * full list page, and hovering it reveals `text` as a tooltip, same as the
 * other preview cards in the row.
 *
 * @param {object} props - Component props.
 * @param {string} props.icon - Bootstrap icon class name (see `Icons.js`).
 * @param {string} props.text - Card text (e.g. "See all Treasures").
 * @param {string} props.href - Hash href for the full list page.
 * @returns {React.ReactElement} See-all card element.
 */
export default function SeeAllCard({ icon, text, href }) {
  return SeeAllCardHelper.render(icon, text, href);
}
