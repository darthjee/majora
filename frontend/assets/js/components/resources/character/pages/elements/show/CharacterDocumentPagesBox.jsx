import DocumentPagesBox from '../../../../document/pages/elements/show/DocumentPagesBox.jsx';

/**
 * Thin bottom-slot wrapper on the PC/NPC `CharacterDocument` detail page (issue #1127), remapping
 * `ShowPageLayout`'s spread `game_document_id` — the underlying `GameDocument`'s own id — to the
 * `id` prop `DocumentPagesBox` expects. `DocumentPagesBox` (issue #1126) is resource-agnostic and
 * expects `id` to mean "`GameDocument` id", while this page's own spread `id` is the
 * `CharacterDocument`'s row id instead; this wrapper is the seam that keeps `DocumentPagesBox`
 * itself untouched, delegating rendering to it entirely once the id is remapped.
 *
 * @param {object} props - Component props, the page's merged `ShowPageLayout` rendering context
 *   spread in.
 * @param {string} props.game_slug - Game slug, used to fetch pages and build pagination links.
 * @param {number|string} props.game_document_id - The underlying `GameDocument`'s id, used to
 *   fetch pages and build pagination links.
 * @param {boolean} [props.canEditPages] - Whether the current user may edit the underlying
 *   `GameDocument`'s pages (issue #1129), forwarded as-is to `DocumentPagesBox`'s own
 *   `canEditPages` prop.
 * @returns {React.ReactElement|null} The pages box element, or `null` while no page is loaded.
 */
export default function CharacterDocumentPagesBox({
  game_slug: gameSlug, game_document_id: gameDocumentId, canEditPages = false,
}) {
  return <DocumentPagesBox game_slug={gameSlug} id={gameDocumentId} canEditPages={canEditPages} />;
}
