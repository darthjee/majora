import CharacterPossessionEdit from './shared/CharacterPossessionEdit.jsx';
import PcCharacterPossessionEditController from './controllers/PcCharacterPossessionEditController.js';

/**
 * PC possession edit page (issue #1076).
 *
 * @returns {React.ReactElement} PC possession edit page element.
 */
export default function PcCharacterPossessionEdit() {
  return (
    <CharacterPossessionEdit
      ControllerClass={PcCharacterPossessionEditController}
      getParamsFromHash={PcCharacterPossessionEditController.getParamsFromHash}
    />
  );
}
