import FactionPreviewCardHelper from './helpers/FactionPreviewCardHelper.jsx';

/**
 * Read-only grid-cell card showing a single enlisted faction's photo, styled like
 * `PossessionPreviewCard`, for use in preview sections (e.g. a character's Factions preview on
 * their show page). When `href` is given, the whole card links to it (issue #943).
 *
 * @param {object} props - Component props.
 * @param {object} props.faction - `CharacterFaction` preview data object, already
 *   fallback-resolved server-side against its linked `GameFaction`.
 * @param {number} props.faction.id - `CharacterFaction` id.
 * @param {string} props.faction.name - Faction name.
 * @param {string|null} [props.faction.photo_path] - Optional faction photo path.
 * @param {string} [props.href] - Optional hash href the whole card links to.
 * @returns {React.ReactElement} Faction preview card element.
 */
export default function FactionPreviewCard({ faction, href }) {
  return FactionPreviewCardHelper.render(faction, href);
}
