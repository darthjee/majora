import PhotoCardHelper from './helpers/PhotoCardHelper.jsx';

/**
 * Bootstrap card representing a single photo. Clicking the card invokes
 * `onClick` with the photo instead of navigating to another page.
 *
 * @param {object} props - Component props.
 * @param {object} props.photo - Photo data object.
 * @param {number} props.photo.id - Photo ID.
 * @param {string} props.photo.path - Photo storage path, used as the image src.
 * @param {string} props.alt - Alt text applied to the photo image.
 * @param {Function} props.onClick - Handler invoked with the photo when the card is clicked.
 * @returns {React.ReactElement} Photo card element.
 */
export default function PhotoCard({ photo, alt, onClick }) {
  return PhotoCardHelper.render(photo, alt, onClick);
}
