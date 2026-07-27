import DocumentFileCardHelper from './helpers/DocumentFileCardHelper.jsx';

/**
 * Grid-cell card showing a single `GameDocumentFile`'s photo (or the default file placeholder
 * when it has none), styled like `ItemPreviewCard`. Clicking the card downloads the file
 * (`file.path`) instead of navigating the SPA away, and the file's name is shown on hover
 * (issue #873).
 *
 * @param {object} props - Component props.
 * @param {object} props.file - `GameDocumentFile` data object.
 * @param {number} props.file.id - File id.
 * @param {string} props.file.name - File name, shown as the hover tooltip content.
 * @param {string} props.file.path - File storage path, used as the download link target.
 * @param {string|null} [props.file.photo_path] - Optional file photo path, falling back to the
 *   default file placeholder when absent.
 * @returns {React.ReactElement} Document file card element.
 */
export default function DocumentFileCard({ file }) {
  return DocumentFileCardHelper.render(file);
}
