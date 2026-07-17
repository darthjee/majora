import CharacterMoneyTreasureBillHelper from './helpers/CharacterMoneyTreasureBillHelper.jsx';

/**
 * Deadlands treasure value display: a gold-background, white-text box
 * rendered below the money bill, showing the treasure value split into
 * dollars/cents and suffixed with the translated `money.in_gems` label.
 * Renders nothing when `treasureValue` is `0`.
 *
 * @param {object} props - Component props.
 * @param {number} props.treasureValue - Treasure value, expressed in cents.
 * @returns {React.ReactElement|null} Treasure bill box element, or null.
 */
export default function CharacterMoneyTreasureBill({ treasureValue }) {
  return CharacterMoneyTreasureBillHelper.render(treasureValue);
}
