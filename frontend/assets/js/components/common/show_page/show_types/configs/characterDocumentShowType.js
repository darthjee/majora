import DescriptionBox from '../../../misc/DescriptionBox.jsx';
import CharacterDocumentPhoto from '../../../../resources/character/pages/elements/show/CharacterDocumentPhoto.jsx';
import CharacterDocumentNameHeading
  from '../../../../resources/character/pages/elements/show/CharacterDocumentNameHeading.jsx';
import CharacterDocumentFilesPreview
  from '../../../../resources/character/pages/elements/show/CharacterDocumentFilesPreview.jsx';
import CharacterDocumentPhotosPreview
  from '../../../../resources/character/pages/elements/show/CharacterDocumentPhotosPreview.jsx';
import CharacterDocumentPagesBox
  from '../../../../resources/character/pages/elements/show/CharacterDocumentPagesBox.jsx';

/**
 * `showTypeConfig` entry for the PC/NPC `CharacterDocument` show page (issue #892, description
 * and file/photo shortlists added in #897) — deliberately does not reuse `documentShowType` (the
 * unrelated `GameDocument` show/new/edit page): that page's photo upload and `new`/`edit` modes
 * don't exist on `CharacterDocument`, which is a thin join carrying only `id`, `game_document_id`,
 * `name`, `photo_path`, `description`, and, on the `/full.json` tier, `hidden` (see
 * `docs/agents/access-control/character-document.md`). `left` keeps the photo next to the name
 * heading, matching `itemShowType`'s/`documentShowType`'s own layout; `right` renders the
 * `GameDocument`-delegated description via the same `DescriptionBox` `documentShowType` reuses;
 * `bottom` renders the files/photos shortlists via the dedicated `CharacterDocumentFilesPreview`/
 * `CharacterDocumentPhotosPreview` pair (mirroring `DocumentFilesPreview`/`DocumentPhotosPreview`,
 * but with no "See all" card, since no full-list page exists yet for a `CharacterDocument`'s files
 * or photos). `CharacterDocumentPagesBox` (issue #1127) — a thin wrapper remapping this page's
 * `game_document_id` to the `id` prop the underlying, resource-agnostic `DocumentPagesBox` (issue
 * #1126) expects — sits in `right`, directly below the description, mirroring `documentShowType`'s
 * own placement of `DocumentPagesBox` (issue #776): it's the document's actual content, so it
 * belongs next to the description it complements rather than off in the full-width `bottom` area.
 * There is still no edit/new mode at all — no `PATCH`/create endpoint exists for
 * `CharacterDocument` — so every slot entry here is `Show`-only.
 */
const characterDocumentShowType = {
  left: [CharacterDocumentPhoto, CharacterDocumentNameHeading],
  right: [
    { Show: DescriptionBox },
    { Show: CharacterDocumentPagesBox },
  ],
  bottom: [
    { Show: CharacterDocumentFilesPreview },
    { Show: CharacterDocumentPhotosPreview },
  ],
};

export default characterDocumentShowType;
