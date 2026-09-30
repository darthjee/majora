import CharacterRecipe from './shared/CharacterRecipe.jsx';

/**
 * NPC recipe detail page (issue #1450).
 *
 * @returns {React.ReactElement} NPC recipe detail page element.
 */
export default function NpcCharacterRecipe() {
  return <CharacterRecipe characterKind="npcs" />;
}
