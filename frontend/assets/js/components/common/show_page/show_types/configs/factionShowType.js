import FactionPhoto from '../../../../resources/faction/pages/elements/show/FactionPhoto.jsx';
import FactionNameHeading from '../../../../resources/faction/pages/elements/show/FactionNameHeading.jsx';
import FactionTitle from '../../../../resources/faction/pages/elements/show/FactionTitle.jsx';
import FactionNameField from '../../../../resources/faction/pages/elements/show/FactionNameField.jsx';
import FactionSubmitButton from '../../../../resources/faction/pages/elements/show/FactionSubmitButton.jsx';

/**
 * `showTypeConfig` entry for the `faction` show/edit pages (issue #812) — no `New` variant
 * anywhere, since faction creation is modal-based (`FactionNewModal.jsx`), matching `Source`
 * rather than `GamePossession`/`GameItem`. Simpler than `itemShowType`/`possessionShowType`:
 * `Faction` has just `name`/`photo_path`, no `description`/`hidden` fields, so the left column
 * only ever needs the photo (plus the name heading on `Show`) and the right column only ever
 * needs the title/name field/submit button on `Edit` — `Show` mode renders nothing in the right
 * column at all.
 */
const factionShowType = {
  left: [
    FactionPhoto,
    { Show: FactionNameHeading },
  ],
  right: [
    { Edit: FactionTitle },
    { Edit: FactionNameField },
    { Edit: FactionSubmitButton },
  ],
  bottom: [],
};

export default factionShowType;
