import DescriptionBox from '../../../misc/DescriptionBox.jsx';
import DocumentPhoto from '../../../../resources/document/pages/elements/show/DocumentPhoto.jsx';
import DocumentNameHeading from '../../../../resources/document/pages/elements/show/DocumentNameHeading.jsx';
import DocumentTitle from '../../../../resources/document/pages/elements/show/DocumentTitle.jsx';
import DocumentNameField from '../../../../resources/document/pages/elements/show/DocumentNameField.jsx';
import DocumentDescriptionField from '../../../../resources/document/pages/elements/show/DocumentDescriptionField.jsx';
import DocumentHiddenField from '../../../../resources/document/pages/elements/show/DocumentHiddenField.jsx';
import DocumentSubmitButton from '../../../../resources/document/pages/elements/show/DocumentSubmitButton.jsx';
import DocumentPhotosPreview from '../../../../resources/document/pages/elements/show/DocumentPhotosPreview.jsx';
import DocumentFilesPreview from '../../../../resources/document/pages/elements/show/DocumentFilesPreview.jsx';
import DocumentPagesBox from '../../../../resources/document/pages/elements/show/DocumentPagesBox.jsx';
import DocumentPagesEditSlot from '../../../../resources/document/pages/elements/edit/DocumentPagesEditSlot.jsx';

/**
 * `showTypeConfig` entry for the `document` show/new/edit pages (issue #758, `Edit`/photo-upload
 * wiring added in #727, photo/file shortlists added in #873) — mirrors `itemShowType`, but
 * simpler: the `/documents/:id/edit` page is photo-upload-only (no `PATCH .../documents/:id.json`
 * endpoint exists), so `left` gains an `Edit` entry for both the photo (`DocumentPhoto`'s `Edit`
 * variant) and the read-only name heading, while `right`'s description slot reuses the same
 * read-only `DescriptionBox` on `Edit` as `Show` — there is no editable name/description/hidden
 * field on the edit page at all, unlike `itemShowType`'s full edit form.
 *
 * The show layout keeps the document's name next to its photo in the left column, matching
 * `itemShowType`'s existing layout. The creation form keeps the `hidden` switch inline with the
 * other fields in the right column, since there is no left column at all on `new` besides the
 * (now upload-capable) photo picker, matching `CharacterItemNewHelper`'s single-column form.
 *
 * `DocumentPagesBox` (issue #1126), the document's own paginated `GameDocumentPage` reader, sits
 * in `right`, directly below the description — it's the document's actual content, so it belongs
 * next to the description it complements rather than off in the full-width `bottom` area (issue
 * #776). On `Edit`, the same slot renders `DocumentPagesEditSlot` instead: the pages editor plus
 * its own page-level Save button and `DocumentPagesSaveFailedAlert` (issue #1129), also moved here
 * from their own container below the whole layout by issue #776, so the editor and its Save/
 * failure-alert actions stay visually grouped with the document fields they act on.
 *
 * `bottom`'s photo/file shortlists (issue #873) are `Show`-only: both need a real, already-
 * persisted `GameDocument` id to fetch against, so they make no sense on `new`/`edit`. The files
 * shortlist is listed before the photos shortlist (issue #897): it's the more useful of the two,
 * so it takes the top slot.
 */
const documentShowType = {
  left: [DocumentPhoto, { Show: DocumentNameHeading, Edit: DocumentNameHeading }],
  right: [
    { New: DocumentTitle },
    { New: DocumentNameField },
    { Show: DescriptionBox, Edit: DescriptionBox, New: DocumentDescriptionField },
    { Show: DocumentPagesBox, Edit: DocumentPagesEditSlot },
    { New: DocumentHiddenField },
    { New: DocumentSubmitButton },
  ],
  bottom: [
    { Show: DocumentFilesPreview },
    { Show: DocumentPhotosPreview },
  ],
};

export default documentShowType;
