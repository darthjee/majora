import CharacterPossessionEdit from './shared/CharacterPossessionEdit.jsx';
import NpcCharacterPossessionEditController from './controllers/NpcCharacterPossessionEditController.js';

/**
 * NPC possession edit page (issue #1076).
 *
 * @returns {React.ReactElement} NPC possession edit page element.
 */
export default function NpcCharacterPossessionEdit() {
  return (
    <CharacterPossessionEdit
      ControllerClass={NpcCharacterPossessionEditController}
      getParamsFromHash={NpcCharacterPossessionEditController.getParamsFromHash}
    />
  );
}
