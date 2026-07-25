import DescriptionBox from '../../../misc/DescriptionBox.jsx';
import DocumentPhoto from '../../../../resources/document/pages/elements/show/DocumentPhoto.jsx';
import DocumentNameHeading from '../../../../resources/document/pages/elements/show/DocumentNameHeading.jsx';
import DocumentTitle from '../../../../resources/document/pages/elements/show/DocumentTitle.jsx';
import DocumentNameField from '../../../../resources/document/pages/elements/show/DocumentNameField.jsx';
import DocumentDescriptionField from '../../../../resources/document/pages/elements/show/DocumentDescriptionField.jsx';
import DocumentHiddenField from '../../../../resources/document/pages/elements/show/DocumentHiddenField.jsx';
import DocumentSubmitButton from '../../../../resources/document/pages/elements/show/DocumentSubmitButton.jsx';

/**
 * `showTypeConfig` entry for the `document` show/new/edit pages (issue #758, `Edit`/photo-upload
 * wiring added in #727) — mirrors `itemShowType`, but simpler: the `/documents/:id/edit` page is
 * photo-upload-only (no `PATCH .../documents/:id.json` endpoint exists), so `left` gains an
 * `Edit` entry for both the photo (`DocumentPhoto`'s `Edit` variant) and the read-only name
 * heading, while `right`'s description slot reuses the same read-only `DescriptionBox` on `Edit`
 * as `Show` — there is no editable name/description/hidden field on the edit page at all, unlike
 * `itemShowType`'s full edit form.
 *
 * The show layout keeps the document's name next to its photo in the left column, matching
 * `itemShowType`'s existing layout. The creation form keeps the `hidden` switch inline with the
 * other fields in the right column, since there is no left column at all on `new` besides the
 * (now upload-capable) photo picker, matching `CharacterItemNewHelper`'s single-column form.
 */
const documentShowType = {
  left: [DocumentPhoto, { Show: DocumentNameHeading, Edit: DocumentNameHeading }],
  right: [
    { New: DocumentTitle },
    { New: DocumentNameField },
    { Show: DescriptionBox, Edit: DescriptionBox, New: DocumentDescriptionField },
    { New: DocumentHiddenField },
    { New: DocumentSubmitButton },
  ],
  bottom: [],
};

export default documentShowType;
