import CharacterDocument from './shared/CharacterDocument.jsx';

/**
 * NPC document detail page (issue #892).
 *
 * @returns {React.ReactElement} NPC document detail page element.
 */
export default function NpcCharacterDocument() {
  return <CharacterDocument characterKind="npcs" />;
}
