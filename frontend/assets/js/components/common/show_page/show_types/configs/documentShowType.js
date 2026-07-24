import DescriptionBox from '../../../misc/DescriptionBox.jsx';
import DocumentPhoto from '../../../../resources/document/pages/elements/show/DocumentPhoto.jsx';
import DocumentNameHeading from '../../../../resources/document/pages/elements/show/DocumentNameHeading.jsx';
import DocumentTitle from '../../../../resources/document/pages/elements/show/DocumentTitle.jsx';
import DocumentNameField from '../../../../resources/document/pages/elements/show/DocumentNameField.jsx';
import DocumentDescriptionField from '../../../../resources/document/pages/elements/show/DocumentDescriptionField.jsx';
import DocumentHiddenField from '../../../../resources/document/pages/elements/show/DocumentHiddenField.jsx';
import DocumentSubmitButton from '../../../../resources/document/pages/elements/show/DocumentSubmitButton.jsx';

/**
 * `showTypeConfig` entry for the `document` show/new pages (issue #758) — mirrors `itemShowType`,
 * but simpler: no `Edit` entries at all (no edit mode in this issue) and no photo-picker/`hidden`
 * left-column slot on the `New` variant (document creation has no photo upload in this issue, so
 * `DocumentPhoto` only declares a `Show` variant and therefore renders nothing on `new`).
 *
 * The show layout keeps the document's name next to its photo in the left column, matching
 * `itemShowType`'s existing layout. The creation form keeps the `hidden` switch inline with the
 * other fields in the right column, since there is no left column at all on `new` (no photo
 * picker), matching `CharacterItemNewHelper`'s single-column form.
 */
const documentShowType = {
  left: [DocumentPhoto, { Show: DocumentNameHeading }],
  right: [
    { New: DocumentTitle },
    { New: DocumentNameField },
    { Show: DescriptionBox, New: DocumentDescriptionField },
    { New: DocumentHiddenField },
    { New: DocumentSubmitButton },
  ],
  bottom: [],
};

export default documentShowType;
