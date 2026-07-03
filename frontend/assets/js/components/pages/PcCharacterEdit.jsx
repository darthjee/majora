import CharacterEdit from './shared/CharacterEdit.jsx';
import PcCharacterEditController, { getPcCharacterEditParamsFromHash }
  from './controllers/PcCharacterEditController.js';
import PcCharacterEditHelper from './helpers/PcCharacterEditHelper.jsx';

/**
 * PC character edit page.
 *
 * @returns {React.ReactElement} PC character edit page element.
 */
export default function PcCharacterEdit() {
  return (
    <CharacterEdit
      ControllerClass={PcCharacterEditController}
      getParamsFromHash={getPcCharacterEditParamsFromHash}
      EditHelper={PcCharacterEditHelper}
      characterKind="pcs"
    />
  );
}
