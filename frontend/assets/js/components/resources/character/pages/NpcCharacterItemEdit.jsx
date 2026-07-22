import CharacterItemEdit from './shared/CharacterItemEdit.jsx';
import NpcCharacterItemEditController from './controllers/NpcCharacterItemEditController.js';

/**
 * NPC item edit page (issue #766).
 *
 * @returns {React.ReactElement} NPC item edit page element.
 */
export default function NpcCharacterItemEdit() {
  return (
    <CharacterItemEdit
      characterKind="npcs"
      ControllerClass={NpcCharacterItemEditController}
      getParamsFromHash={NpcCharacterItemEditController.getParamsFromHash}
    />
  );
}
