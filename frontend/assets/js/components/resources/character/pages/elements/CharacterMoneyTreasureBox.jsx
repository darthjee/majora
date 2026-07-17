import CharacterMoneyTreasureBoxHelper from './helpers/CharacterMoneyTreasureBoxHelper.jsx';

/**
 * D&D treasure value display: a bright-red coin-style box showing the
 * cascading CP/SP/GP breakdown of the character's treasure value, joined
 * with `" | "` and suffixed with the translated `money.in_gems` label.
 * Renders nothing when `treasureValue` is `0`.
 *
 * @param {object} props - Component props.
 * @param {number} props.treasureValue - Treasure value, expressed in copper pieces.
 * @returns {React.ReactElement|null} Treasure box element, or null.
 */
export default function CharacterMoneyTreasureBox({ treasureValue }) {
  return CharacterMoneyTreasureBoxHelper.render(treasureValue);
}
