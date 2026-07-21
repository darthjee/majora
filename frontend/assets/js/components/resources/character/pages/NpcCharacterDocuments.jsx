import CharacterDocuments from './shared/CharacterDocuments.jsx';

/**
 * NPC Documents index page.
 *
 * @returns {React.ReactElement} NPC documents page element.
 */
export default function NpcCharacterDocuments() {
  return <CharacterDocuments characterKind="npcs" listType="npc-documents" />;
}
