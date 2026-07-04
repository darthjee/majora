import TreasureCardHelper from './helpers/TreasureCardHelper.jsx';

/**
 * Bootstrap card representing a single treasure.
 *
 * @param {object} props - Component props.
 * @param {object} props.treasure - Treasure data object.
 * @param {number} props.treasure.id - Treasure ID.
 * @param {string} props.treasure.name - Treasure name.
 * @param {number} props.treasure.value - Treasure value.
 * @param {string|null} [props.treasure.photo_path] - Optional treasure photo path.
 * @param {boolean} [props.isSuperUser] - Whether the current user may upload a photo.
 * @param {Function} [props.onUploadClick] - Handler invoked with the treasure when the upload button is clicked.
 * @returns {React.ReactElement} Treasure card element.
 */
export default function TreasureCard({ treasure, isSuperUser, onUploadClick }) {
  return TreasureCardHelper.render(treasure, isSuperUser, onUploadClick);
}
