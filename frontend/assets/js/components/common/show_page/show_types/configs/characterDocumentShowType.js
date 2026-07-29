import CharacterDocumentPhoto from '../../../../resources/character/pages/elements/show/CharacterDocumentPhoto.jsx';
import CharacterDocumentNameHeading
  from '../../../../resources/character/pages/elements/show/CharacterDocumentNameHeading.jsx';

/**
 * `showTypeConfig` entry for the PC/NPC `CharacterDocument` show page (issue #892) — deliberately
 * does not reuse `documentShowType` (the unrelated `GameDocument` show/new/edit page): that page's
 * fields (`description`, photo upload, photo/file shortlists) don't exist on `CharacterDocument`,
 * which is a thin join carrying only `id`, `game_document_id`, `name`, `photo_path`, and, on the
 * `/full.json` tier, `hidden` (see `docs/agents/access-control/character-document.md`). `left`
 * keeps the photo next to the name heading, matching `itemShowType`'s/`documentShowType`'s own
 * layout; `right`/`bottom` are empty — there is no description box, no edit/new mode at all (no
 * `PATCH`/create endpoint exists for `CharacterDocument`), and no photo/file shortlists.
 */
const characterDocumentShowType = {
  left: [CharacterDocumentPhoto, CharacterDocumentNameHeading],
  right: [],
  bottom: [],
};

export default characterDocumentShowType;
