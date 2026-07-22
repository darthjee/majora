import ShowPageLayout from '../../../../common/show_page/ShowPageLayout.jsx';
import CharacterHelper from './CharacterHelper.jsx';

/**
 * Rendering helper for the PC character edit page.
 */
export default class PcCharacterEditHelper {
  /**
   * Render the PC edit form.
   *
   * @param {{isFullEditor: boolean, name: string, profile_photo_path: string|null,
   *   links: object[], role: string, description: string, privateDescription: string,
   *   money: string, treasureValue: number, gameType: string, status: string,
   *   fieldErrors: object}} formState - Form state.
   * @param {{onSubmit: Function, onNameChange: Function, onRoleChange: Function,
   *   onDescriptionChange: Function, onPrivateDescriptionChange: Function,
   *   onMoneyChange: Function, onOpenUploadModal: Function, onOpenLinksModal: Function,
   *   onOpenMoneyModal: Function}} handlers - Event handlers.
   * @returns {React.ReactElement} Rendered edit page.
   */
  static render(formState, handlers) {
    return (
      <ShowPageLayout
        type="pc"
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
