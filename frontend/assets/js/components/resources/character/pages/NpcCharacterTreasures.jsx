import CharacterTreasures from './shared/CharacterTreasures.jsx';

/**
 * NPC character Treasures index page.
 *
 * @returns {React.ReactElement} NPC character treasures page element.
 */
export default function NpcCharacterTreasures() {
  return <CharacterTreasures characterKind="npcs" listType="npc-treasures" isPc={false} />;
}
