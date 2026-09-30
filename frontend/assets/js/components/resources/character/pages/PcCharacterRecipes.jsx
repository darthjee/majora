import CharacterRecipes from './shared/CharacterRecipes.jsx';

/**
 * PC Recipes index page (issue #1450).
 *
 * @returns {React.ReactElement} PC recipes page element.
 */
export default function PcCharacterRecipes() {
  return <CharacterRecipes characterKind="pcs" listType="pc-recipes" isPc />;
}
