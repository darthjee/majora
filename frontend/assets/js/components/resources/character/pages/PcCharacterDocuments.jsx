import CharacterDocuments from './shared/CharacterDocuments.jsx';

/**
 * PC Documents index page.
 *
 * @returns {React.ReactElement} PC documents page element.
 */
export default function PcCharacterDocuments() {
  return <CharacterDocuments characterKind="pcs" listType="pc-documents" />;
}
