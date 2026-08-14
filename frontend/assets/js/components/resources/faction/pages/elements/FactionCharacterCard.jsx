import FactionCharacterCardHelper from './helpers/FactionCharacterCardHelper.jsx';
import Noop from '../../../../../utils/Noop.js';

/**
 * Grid-cell card showing a single character enlisted in a faction, styled like
 * `PossessionPreviewCard` (photo + name, whole card links out), for the faction show page's
 * character-list panel (issue #943). Also hosts a per-row hover-revealed "kick" action button
 * (issue #1106) when the caller passes `canKick`.
 *
 * @param {object} props - Component props.
 * @param {object} props.character - Faction character-list entry (`{id, name, type, photo_path}`,
 *   per the `/factions/:id/characters.json` shape).
 * @param {string} props.gameSlug - Game slug, used to build the click-through href.
 * @param {boolean} [props.canKick] - Whether the current viewer may kick this character from the
 *   faction; gates the kick button, hidden entirely (not disabled) when false. Defaults to `false`.
 * @param {Function} [props.onKick] - Handler invoked with `character` when the kick button is
 *   clicked. Defaults to a no-op.
 * @returns {React.ReactElement} Faction character card element.
 */
export default function FactionCharacterCard({
  character, gameSlug, canKick = false, onKick = Noop.noop,
}) {
  return FactionCharacterCardHelper.render(character, gameSlug, canKick, onKick);
}
