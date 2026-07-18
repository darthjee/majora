import CharacterTreasures from './shared/CharacterTreasures.jsx';

/**
 * PC character Treasures index page.
 *
 * @returns {React.ReactElement} PC character treasures page element.
 */
export default function PcCharacterTreasures() {
  return <CharacterTreasures characterKind="pcs" listType="pc-treasures" isPc />;
}
