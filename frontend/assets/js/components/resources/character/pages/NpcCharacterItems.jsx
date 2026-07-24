import CharacterItems from './shared/CharacterItems.jsx';

/**
 * NPC Items index page.
 *
 * @returns {React.ReactElement} NPC items page element.
 */
export default function NpcCharacterItems() {
  return <CharacterItems characterKind="npcs" listType="npc-items" isPc={false} />;
}
