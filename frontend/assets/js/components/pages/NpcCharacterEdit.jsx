import CharacterEdit from './shared/CharacterEdit.jsx';
import NpcCharacterEditController, { getNpcCharacterEditParamsFromHash }
  from './controllers/NpcCharacterEditController.js';
import NpcCharacterEditHelper from './helpers/NpcCharacterEditHelper.jsx';

/**
 * NPC character edit page.
 *
 * @returns {React.ReactElement} NPC character edit page element.
 */
export default function NpcCharacterEdit() {
  return (
    <CharacterEdit
      ControllerClass={NpcCharacterEditController}
      getParamsFromHash={getNpcCharacterEditParamsFromHash}
      EditHelper={NpcCharacterEditHelper}
      characterKind="npcs"
    />
  );
}
