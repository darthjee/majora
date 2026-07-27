import ShowPageLayout from '../../../../common/show_page/ShowPageLayout.jsx';

/**
 * Rendering helper for the game NPC creation page.
 */
export default class GameNpcNewHelper {
  /**
   * Render the NPC creation form.
   *
   * @description The NPC does not exist yet, so there is no id to scope a
   *   treasures/photos breakdown to: the avatar is editable but picking a
   *   photo opens the upload modal in its deferred mode (see
   *   `PhotoUploadModal`), which just keeps the picked file in the page's own
   *   state (rendered here as `profile_photo_path`, normalized from the page's
   *   own `photoPreviewUrl` state so it lines up with the edit page's field
   *   name) until the NPC is created and the photo is actually uploaded.
   *   Before a photo is picked, the avatar shows its default static
   *   placeholder image. `treasureValue` is always `0`, since a not-yet-existing character has no
   *   treasures. `isFullEditor` reflects whether the current viewer is a full (dm/admin/superuser)
   *   creator or a reduced-field player/staff creator (issue #868) — same meaning the NPC edit
   *   page's own `isFullEditor` already carries — so the shared "new"-mode slots
   *   (`CharacterHiddenSlot`, `CharacterAllegianceFieldsSlot`, `CharacterDmNotesSlot`,
   *   `CharacterMoneySlot`) hide their private/full-only fields for reduced-access creators.
   * @param {{name: string, role: string, description: string, privateDescription: string,
   *   links: object[], hidden: boolean, money: string, gameType: string, privateAllegiance: string,
   *   publicAllegiance: string, isFullEditor: boolean, status: string, fieldErrors: object,
   *   profile_photo_path: string|null}} formState - Form state.
   * @param {{onSubmit: Function, onNameChange: Function, onRoleChange: Function,
   *   onDescriptionChange: Function, onPrivateDescriptionChange: Function,
   *   onOpenLinksModal: Function, onOpenUploadModal: Function, onOpenMoneyModal: Function,
   *   onHiddenChange: Function, onPrivateAllegianceChange: Function,
   *   onPublicAllegianceChange: Function,
   *   onRetryPhotoUpload: Function, onSkipPhotoUpload: Function}} handlers - Event handlers.
   * @returns {React.ReactElement} Rendered new NPC page.
   */
  static render(formState, handlers) {
    return (
      <ShowPageLayout
        type="npc"
        mode="new"
        context={{
          treasureValue: 0, ...formState, handlers,
        }}
      />
    );
  }
}
