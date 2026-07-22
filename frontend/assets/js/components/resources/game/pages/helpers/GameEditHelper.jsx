import ShowPageLayout from '../../../../common/show_page/ShowPageLayout.jsx';
import GameHelper from './GameHelper.jsx';

/**
 * Rendering helper for the game edit page.
 */
export default class GameEditHelper {
  /**
   * Render the game edit form.
   *
   * @param {{name: string, description: string, cover_photo_path: string|null,
   *   status: string, fieldErrors: object}} formState - Form state.
   * @param {{onSubmit: Function, onNameChange: Function,
   *   onDescriptionChange: Function,
   *   onOpenUploadModal: Function}} handlers - Event handlers.
   * @returns {React.ReactElement} Rendered edit page.
   */
  static render(formState, handlers) {
    return (
      <ShowPageLayout
        type="game"
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
    return GameHelper.renderLoading();
  }
}
