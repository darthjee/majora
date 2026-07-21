import DocumentPreviewCardHelper from './helpers/DocumentPreviewCardHelper.jsx';

/**
 * Read-only grid-cell card showing a single document's photo, styled like
 * `ItemPreviewCard`, for use in preview sections (e.g. a character's
 * Documents preview on their show page). The card is not a link: documents have no
 * standalone detail page in scope (issue #725).
 *
 * @param {object} props - Component props.
 * @param {object} props.document - CharacterDocument preview data object, already
 *   fallback-resolved server-side against its linked `GameDocument`.
 * @param {number} props.document.id - CharacterDocument id.
 * @param {string} props.document.name - Document name.
 * @param {string|null} [props.document.photo_path] - Optional document photo path.
 * @returns {React.ReactElement} Document preview card element.
 */
export default function DocumentPreviewCard({ document }) {
  return DocumentPreviewCardHelper.render(document);
}
