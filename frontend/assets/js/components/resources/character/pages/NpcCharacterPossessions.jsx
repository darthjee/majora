import CharacterPossessions from './shared/CharacterPossessions.jsx';

/**
 * NPC Possessions index page.
 *
 * @returns {React.ReactElement} NPC possessions page element.
 */
export default function NpcCharacterPossessions() {
  return <CharacterPossessions characterKind="npcs" listType="npc-possessions" isPc={false} />;
}
