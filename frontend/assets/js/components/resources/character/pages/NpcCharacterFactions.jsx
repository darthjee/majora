import CharacterFactions from './shared/CharacterFactions.jsx';

/**
 * NPC Factions index page.
 *
 * @returns {React.ReactElement} NPC factions page element.
 */
export default function NpcCharacterFactions() {
  return <CharacterFactions characterKind="npcs" listType="npc-factions" isPc={false} />;
}
