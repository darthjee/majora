import CharacterItems from './shared/CharacterItems.jsx';

/**
 * PC Items index page.
 *
 * @returns {React.ReactElement} PC items page element.
 */
export default function PcCharacterItems() {
  return <CharacterItems characterKind="pcs" listType="pc-items" />;
}
