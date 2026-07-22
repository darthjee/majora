import CharacterAvatarSlot from '../../../../resources/character/pages/elements/show/CharacterAvatarSlot.jsx';
import CharacterNameShow, { buildCharacterNameField } from '../../../../resources/character/pages/elements/show/CharacterNameSlot.jsx';
import CharacterLinksShow, { buildCharacterLinksField } from '../../../../resources/character/pages/elements/show/CharacterLinksSlot.jsx';
import CharacterMoneyShow, { buildCharacterMoneyField } from '../../../../resources/character/pages/elements/show/CharacterMoneySlot.jsx';
import { buildCharacterTitleField } from '../../../../resources/character/pages/elements/show/CharacterTitleSlot.jsx';
import CharacterRoleShow, { buildCharacterRoleField } from '../../../../resources/character/pages/elements/show/CharacterRoleSlot.jsx';
import CharacterDescriptionShow, { buildCharacterDescriptionField } from '../../../../resources/character/pages/elements/show/CharacterDescriptionSlot.jsx';
import CharacterDmNotesShow, { buildCharacterDmNotesField } from '../../../../resources/character/pages/elements/show/CharacterDmNotesSlot.jsx';
import { buildCharacterSubmitButton } from '../../../../resources/character/pages/elements/show/CharacterSubmitSlot.jsx';
import CharacterPreviewSectionsSlot from '../../../../resources/character/pages/elements/show/CharacterPreviewSectionsSlot.jsx';
import CharacterPhotosPreviewSlot from '../../../../resources/character/pages/elements/show/CharacterPhotosPreviewSlot.jsx';

const pcNameField = buildCharacterNameField(
  { edit: { id: 'pc-edit-name', labelKey: 'pc_edit_page.name_label' } },
  false,
);
const pcLinksField = buildCharacterLinksField({ edit: 'pc_edit_page.edit_links_button' });
const pcMoneyField = buildCharacterMoneyField({
  edit: { label: 'pc_edit_page.money_label', button: 'pc_edit_page.edit_money_button' },
});
const pcTitleField = buildCharacterTitleField({
  edit: { title: 'pc_edit_page.title', error: 'pc_edit_page.error' },
});
const pcRoleField = buildCharacterRoleField(
  { edit: { id: 'pc-edit-role', label: 'pc_edit_page.role_label' } },
  false,
);
const pcDescriptionField = buildCharacterDescriptionField({
  edit: { id: 'pc-edit-description', label: 'pc_edit_page.description_label' },
});
const pcDmNotesField = buildCharacterDmNotesField({
  edit: { id: 'pc-edit-private-description', label: 'pc_edit_page.private_description_label' },
});
const pcSubmitButton = buildCharacterSubmitButton({ edit: 'pc_edit_page.submit' });

/**
 * `showTypeConfig` entry for the `pc` show/edit pages (PCs have no creation flow of their own).
 * The show-mode slots (`CharacterAvatarSlot`, `CharacterNameShow`, ...) are shared verbatim with
 * the `npc` config, since `CharacterHelper#render` was already identical for both character
 * kinds before this migration; only the edit-mode field ids/labels/gating differ per kind.
 */
const pcShowType = {
  left: [
    CharacterAvatarSlot,
    { Show: CharacterNameShow, Edit: pcNameField },
    { Show: CharacterLinksShow, Edit: pcLinksField },
    { Show: CharacterMoneyShow, Edit: pcMoneyField },
  ],
  right: [
    { Edit: pcTitleField },
    { Show: CharacterRoleShow, Edit: pcRoleField },
    { Show: CharacterDescriptionShow, Edit: pcDescriptionField },
    { Show: CharacterDmNotesShow, Edit: pcDmNotesField },
    { Show: CharacterPreviewSectionsSlot },
    { Edit: pcSubmitButton },
  ],
  bottom: [
    { Show: CharacterPhotosPreviewSlot },
  ],
};

export default pcShowType;
