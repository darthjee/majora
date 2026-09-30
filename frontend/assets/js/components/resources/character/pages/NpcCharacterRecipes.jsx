import CharacterRecipes from './shared/CharacterRecipes.jsx';

/**
 * NPC Recipes index page (issue #1450).
 *
 * @returns {React.ReactElement} NPC recipes page element.
 */
export default function NpcCharacterRecipes() {
  return <CharacterRecipes characterKind="npcs" listType="npc-recipes" isPc={false} />;
}
