import FactionPhoto from '../../../../resources/faction/pages/elements/show/FactionPhoto.jsx';
import FactionNameHeading from '../../../../resources/faction/pages/elements/show/FactionNameHeading.jsx';
import FactionTitle from '../../../../resources/faction/pages/elements/show/FactionTitle.jsx';
import FactionNameField from '../../../../resources/faction/pages/elements/show/FactionNameField.jsx';
import FactionSubmitButton from '../../../../resources/faction/pages/elements/show/FactionSubmitButton.jsx';
import FactionCharactersPanel from '../../../../resources/faction/pages/elements/FactionCharactersPanel.jsx';

/**
 * `showTypeConfig` entry for the `faction` show/edit pages (issue #812) — no `New` variant
 * anywhere, since faction creation is modal-based (`FactionNewModal.jsx`), matching `Source`
 * rather than `GamePossession`/`GameItem`. Simpler than `itemShowType`/`possessionShowType`:
 * `GameFaction` has just `name`/`photo_path`, no `description`/`hidden` fields, so the left
 * column only ever needs the photo (plus the name heading on `Show`); the right column needs the
 * title/name field/submit button on `Edit`, and, on `Show` (issue #943), the character-list panel
 * — `GameFaction.jsx`'s own docstring used to note it "renders no give/acquisition modal", no
 * longer true now that the recruit modal/panel have landed.
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
    { Show: FactionCharactersPanel },
  ],
  bottom: [],
};

export default factionShowType;
