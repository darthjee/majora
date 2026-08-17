import DocumentPagesEditSlotHelper from './helpers/DocumentPagesEditSlotHelper.jsx';
import Noop from '../../../../../../utils/Noop.js';

/**
 * `right`-column edit-mode slot for the game document edit page (issue #1129, moved from its own
 * container below `ShowPageLayout` into the layout's `right` column by issue #776): groups
 * `DocumentPagesEditBox`, the page-level Save button, and `DocumentPagesSaveFailedAlert` together,
 * reading all of their wiring off the page's own merged `ShowPageLayout` context —
 * `GameDocumentEditHelper.render`'s `pages` argument, folded into `context` alongside `document`
 * and `canUploadPhoto` — the same way `DocumentPagesBox` already reads `game_slug`/`id`/
 * `canEditPages` off that same context on the show page.
 *
 * @param {object} props - Component props, the page's merged `ShowPageLayout` rendering context
 *   spread in.
 * @param {string} [props.game_slug] - Game slug, forwarded to `DocumentPagesEditBox`.
 * @param {number|string} [props.id] - `GameDocument` id, forwarded to `DocumentPagesEditBox`.
 * @param {boolean} [props.canEditPages] - Whether the current user may edit this document's
 *   pages, also gating the Save button — there is no separate general "edit" permission for
 *   documents. Defaults to `false`.
 * @param {React.Ref} [props.pagesRef] - Imperative handle ref for `DocumentPagesEditBox`.
 * @param {string} [props.saveStatus] - `'idle'`, `'saving'`, or `'failed'`. Defaults to `'idle'`.
 * @param {Function} [props.onSave] - Handler for the page-level Save button.
 * @param {Function} [props.onRetrySave] - Handler for the failure alert's Retry action.
 * @param {Function} [props.onSkipSave] - Handler for the failure alert's Skip action.
 * @returns {React.ReactElement} The pages-edit slot element.
 */
export default function DocumentPagesEditSlot({
  game_slug: gameSlug, id, canEditPages = false, pagesRef, saveStatus = 'idle',
  onSave = Noop.noop, onRetrySave = Noop.noop, onSkipSave = Noop.noop,
}) {
  return DocumentPagesEditSlotHelper.render(
    { gameSlug, id, canEditPages, pagesRef },
    { saveStatus, onSave, onRetrySave, onSkipSave },
  );
}
