import CharacterItemEdit from './shared/CharacterItemEdit.jsx';
import PcCharacterItemEditController from './controllers/PcCharacterItemEditController.js';

/**
 * PC item edit page (issue #766).
 *
 * @returns {React.ReactElement} PC item edit page element.
 */
export default function PcCharacterItemEdit() {
  return (
    <CharacterItemEdit
      characterKind="pcs"
      ControllerClass={PcCharacterItemEditController}
      getParamsFromHash={PcCharacterItemEditController.getParamsFromHash}
    />
  );
}
