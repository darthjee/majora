import CharacterDetail from './shared/CharacterDetail.jsx';
import PcCharacterController from './controllers/PcCharacterController.js';

/**
 * PC character detail page.
 *
 * @returns {React.ReactElement} PC character detail page element.
 */
export default function PcCharacter() {
  return (
    <CharacterDetail
      ControllerClass={PcCharacterController}
      getParamsFromHash={PcCharacterController.getPcCharacterParamsFromHash}
      characterKind="pcs"
    />
  );
}
