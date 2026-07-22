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
   *   placeholder image. `isFullEditor` is always `true` and `treasureValue`
   *   always `0`, since creation is always performed by a full editor of a
   *   not-yet-existing character.
   * @param {{name: string, role: string, description: string, privateDescription: string,
   *   links: object[], hidden: boolean, money: string, gameType: string, allegiance: string,
   *   publicAllegiance: string, status: string, fieldErrors: object,
   *   profile_photo_path: string|null}} formState - Form state.
   * @param {{onSubmit: Function, onNameChange: Function, onRoleChange: Function,
   *   onDescriptionChange: Function, onPrivateDescriptionChange: Function,
   *   onOpenLinksModal: Function, onOpenUploadModal: Function, onOpenMoneyModal: Function,
   *   onHiddenChange: Function, onAllegianceChange: Function, onPublicAllegianceChange: Function,
   *   onRetryPhotoUpload: Function, onSkipPhotoUpload: Function}} handlers - Event handlers.
   * @returns {React.ReactElement} Rendered new NPC page.
   */
  static render(formState, handlers) {
    return (
      <ShowPageLayout
        type="npc"
        mode="new"
        context={{
          isFullEditor: true, treasureValue: 0, ...formState, handlers,
        }}
      />
    );
  }
}
