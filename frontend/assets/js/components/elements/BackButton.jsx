import BackButtonHelper from './helpers/BackButtonHelper.jsx';

/**
 * Back navigation button linking to a parent page.
 *
 * @param {object} props - Component props.
 * @param {string} props.href - Hash path to navigate back to.
 * @returns {React.ReactElement} Back button element.
 */
export default function BackButton({ href }) {
  return BackButtonHelper.render(href);
}
