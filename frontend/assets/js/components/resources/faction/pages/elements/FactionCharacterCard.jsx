import FactionCharacterCardHelper from './helpers/FactionCharacterCardHelper.jsx';

/**
 * Read-only grid-cell card showing a single character enlisted in a faction, styled like
 * `PossessionPreviewCard` (photo + name, whole card links out), for the faction show page's
 * character-list panel (issue #943).
 *
 * @param {object} props - Component props.
 * @param {object} props.character - Faction character-list entry (`{id, name, type, photo_path}`,
 *   per the `/factions/:id/characters.json` shape).
 * @param {string} props.gameSlug - Game slug, used to build the click-through href.
 * @returns {React.ReactElement} Faction character card element.
 */
export default function FactionCharacterCard({ character, gameSlug }) {
  return FactionCharacterCardHelper.render(character, gameSlug);
}
