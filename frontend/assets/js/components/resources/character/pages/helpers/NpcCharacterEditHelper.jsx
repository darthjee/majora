import ShowPageLayout from '../../../../common/show_page/ShowPageLayout.jsx';
import CharacterHelper from './CharacterHelper.jsx';

/**
 * Rendering helper for the NPC character edit page.
 */
export default class NpcCharacterEditHelper {
  /**
   * Render the NPC edit form.
   *
   * @param {{isFullEditor: boolean, name: string, profile_photo_path: string|null,
   *   links: object[], role: string, description: string, privateDescription: string,
   *   money: string, treasureValue: number, gameType: string, allegiance: string,
   *   publicAllegiance: string, publicSlain: boolean, hidden: boolean, status: string,
   *   fieldErrors: object}} formState - Form state.
   * @param {{onSubmit: Function, onNameChange: Function, onRoleChange: Function,
   *   onDescriptionChange: Function, onPrivateDescriptionChange: Function,
   *   onMoneyChange: Function, onOpenUploadModal: Function, onOpenLinksModal: Function,
   *   onOpenMoneyModal: Function, onAllegianceChange: Function,
   *   onPublicAllegianceChange: Function, onPublicSlainChange: Function,
   *   onHiddenChange: Function}} handlers - Event handlers.
   * @returns {React.ReactElement} Rendered edit page.
   */
  static render(formState, handlers) {
    return (
      <ShowPageLayout
        type="npc"
        mode="edit"
        context={{ ...formState, handlers }}
      />
    );
  }

  /**
   * Render the loading state.
   *
   * @returns {React.ReactElement} Loading message.
   */
  static renderLoading() {
    return CharacterHelper.renderLoading();
  }
}
