import CharacterTreasures from './shared/CharacterTreasures.jsx';
import NpcCharacterTreasuresController from './controllers/NpcCharacterTreasuresController.js';

/**
 * NPC character Treasures index page.
 *
 * @returns {React.ReactElement} NPC character treasures page element.
 */
export default function NpcCharacterTreasures() {
  return (
    <CharacterTreasures
      ControllerClass={NpcCharacterTreasuresController}
      getParamsFromHash={NpcCharacterTreasuresController.getNpcCharacterTreasuresParamsFromHash}
      characterKind="npcs"
      isPc={false}
    />
  );
}
