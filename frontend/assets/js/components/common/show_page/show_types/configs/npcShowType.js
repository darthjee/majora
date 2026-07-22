import CharacterAvatarSlot from '../../../../resources/character/pages/elements/show/CharacterAvatarSlot.jsx';
import CharacterNameShow, { buildCharacterNameField } from '../../../../resources/character/pages/elements/show/CharacterNameSlot.jsx';
import CharacterLinksShow, { buildCharacterLinksField } from '../../../../resources/character/pages/elements/show/CharacterLinksSlot.jsx';
import CharacterMoneyShow, { buildCharacterMoneyField } from '../../../../resources/character/pages/elements/show/CharacterMoneySlot.jsx';
import { buildCharacterTitleField } from '../../../../resources/character/pages/elements/show/CharacterTitleSlot.jsx';
import CharacterRoleShow, { buildCharacterRoleField } from '../../../../resources/character/pages/elements/show/CharacterRoleSlot.jsx';
import CharacterDescriptionShow, { buildCharacterDescriptionField } from '../../../../resources/character/pages/elements/show/CharacterDescriptionSlot.jsx';
import CharacterDmNotesShow, { buildCharacterDmNotesField } from '../../../../resources/character/pages/elements/show/CharacterDmNotesSlot.jsx';
import { buildCharacterHiddenField } from '../../../../resources/character/pages/elements/show/CharacterHiddenSlot.jsx';
import { buildCharacterAllegianceFields } from '../../../../resources/character/pages/elements/show/CharacterAllegianceFieldsSlot.jsx';
import CharacterPublicSlainFieldSlot from '../../../../resources/character/pages/elements/show/CharacterPublicSlainFieldSlot.jsx';
import { buildCharacterSubmitButton } from '../../../../resources/character/pages/elements/show/CharacterSubmitSlot.jsx';
import CharacterPreviewSectionsSlot from '../../../../resources/character/pages/elements/show/CharacterPreviewSectionsSlot.jsx';
import CharacterPhotosPreviewSlot from '../../../../resources/character/pages/elements/show/CharacterPhotosPreviewSlot.jsx';
import NpcNewPhotoUploadFailedAlert from '../../../../resources/character/pages/elements/show/NpcNewPhotoUploadFailedAlert.jsx';

const npcNameField = buildCharacterNameField(
  {
    edit: { id: 'npc-edit-name', labelKey: 'npc_edit_page.name_label' },
    new: { id: 'game-npc-new-name', labelKey: 'game_npc_new_page.name_label' },
  },
  true,
);
const npcHiddenField = buildCharacterHiddenField({
  edit: { id: 'npc-edit-hidden', label: 'npc_edit_page.hidden_label' },
  new: { id: 'game-npc-new-hidden', label: 'game_npc_new_page.hidden_label' },
});
const npcLinksField = buildCharacterLinksField({
  // The creation page reuses the edit page's "Edit links" translation key (an existing quirk of
  // `GameNpcNewHelper`, carried over unchanged).
  edit: 'npc_edit_page.edit_links_button',
  new: 'npc_edit_page.edit_links_button',
});
const npcMoneyField = buildCharacterMoneyField({
  edit: { label: 'npc_edit_page.money_label', button: 'npc_edit_page.edit_money_button' },
  new: { label: 'game_npc_new_page.money_label', button: 'game_npc_new_page.edit_money_button' },
});
const npcTitleField = buildCharacterTitleField(
  {
    edit: { title: 'npc_edit_page.title', error: 'npc_edit_page.error' },
    new: { title: 'game_npc_new_page.title', error: 'game_npc_new_page.error' },
  },
  NpcNewPhotoUploadFailedAlert,
);
const npcRoleField = buildCharacterRoleField(
  {
    edit: { id: 'npc-edit-role', label: 'npc_edit_page.role_label' },
    new: { id: 'game-npc-new-role', label: 'game_npc_new_page.role_label' },
  },
  true,
);
const npcDescriptionField = buildCharacterDescriptionField({
  edit: { id: 'npc-edit-description', label: 'npc_edit_page.description_label' },
  new: { id: 'game-npc-new-description', label: 'game_npc_new_page.description_label' },
});
const npcDmNotesField = buildCharacterDmNotesField({
  edit: { id: 'npc-edit-private-description', label: 'npc_edit_page.private_description_label' },
  new: { id: 'game-npc-new-private-description', label: 'game_npc_new_page.private_description_label' },
});
const npcAllegianceFields = buildCharacterAllegianceFields({
  edit: { namespace: 'npc_edit_page', idPrefix: 'npc-edit' },
  new: { namespace: 'game_npc_new_page', idPrefix: 'game-npc-new' },
});
const npcSubmitButton = buildCharacterSubmitButton(
  { edit: 'npc_edit_page.submit', new: 'game_npc_new_page.submit' },
  true,
);

/**
 * `showTypeConfig` entry for the `npc` show/new/edit pages. The show-mode slots
 * (`CharacterAvatarSlot`, `CharacterNameShow`, ...) are shared verbatim with the `pc` config,
 * since `CharacterHelper#render` was already identical for both character kinds before this
 * migration; only the new/edit-mode field ids/labels/gating (and the NPC-only
 * hidden/allegiance/slain fields) differ.
 */
const npcShowType = {
  left: [
    CharacterAvatarSlot,
    { New: npcHiddenField, Edit: npcHiddenField },
    { Show: CharacterNameShow, New: npcNameField, Edit: npcNameField },
    { Show: CharacterLinksShow, New: npcLinksField, Edit: npcLinksField },
    { Show: CharacterMoneyShow, New: npcMoneyField, Edit: npcMoneyField },
  ],
  right: [
    { New: npcTitleField, Edit: npcTitleField },
    { Show: CharacterRoleShow, New: npcRoleField, Edit: npcRoleField },
    { Show: CharacterDescriptionShow, New: npcDescriptionField, Edit: npcDescriptionField },
    { Show: CharacterDmNotesShow, New: npcDmNotesField, Edit: npcDmNotesField },
    { New: npcAllegianceFields, Edit: npcAllegianceFields },
    { Edit: CharacterPublicSlainFieldSlot },
    { Show: CharacterPreviewSectionsSlot },
    { New: npcSubmitButton, Edit: npcSubmitButton },
  ],
  bottom: [
    { Show: CharacterPhotosPreviewSlot },
  ],
};

export default npcShowType;
