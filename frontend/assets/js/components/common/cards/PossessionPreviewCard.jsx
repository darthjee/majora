import PossessionPreviewCardHelper from './helpers/PossessionPreviewCardHelper.jsx';

/**
 * Read-only grid-cell card showing a single possession's photo, styled like
 * `ItemPreviewCard`, for use in preview sections (e.g. a character's
 * Possessions preview on their show page). When `href` is given, the whole card
 * links to it (the possession's own detail page), matching `ItemPreviewCard`'s
 * behavior.
 *
 * @param {object} props - Component props.
 * @param {object} props.possession - CharacterPossession preview data object, already
 *   fallback-resolved server-side against its linked `GamePossession`.
 * @param {number} props.possession.id - CharacterPossession id.
 * @param {string} props.possession.name - Possession name.
 * @param {string|null} [props.possession.photo_path] - Optional possession photo path.
 * @param {string} [props.href] - Optional hash href the whole card links to.
 * @returns {React.ReactElement} Possession preview card element.
 */
export default function PossessionPreviewCard({ possession, href }) {
  return PossessionPreviewCardHelper.render(possession, href);
}
