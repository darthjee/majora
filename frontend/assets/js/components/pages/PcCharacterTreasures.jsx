import CharacterTreasures from './shared/CharacterTreasures.jsx';
import PcCharacterTreasuresController from './controllers/PcCharacterTreasuresController.js';

/**
 * PC character Treasures index page.
 *
 * @returns {React.ReactElement} PC character treasures page element.
 */
export default function PcCharacterTreasures() {
  return (
    <CharacterTreasures
      ControllerClass={PcCharacterTreasuresController}
      getParamsFromHash={PcCharacterTreasuresController.getPcCharacterTreasuresParamsFromHash}
      characterKind="pcs"
      isPc
    />
  );
}
