import CharacterRecipe from './shared/CharacterRecipe.jsx';

/**
 * PC recipe detail page (issue #1450).
 *
 * @returns {React.ReactElement} PC recipe detail page element.
 */
export default function PcCharacterRecipe() {
  return <CharacterRecipe characterKind="pcs" />;
}
