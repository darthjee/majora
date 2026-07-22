import ShowPageLayout from '../../../../common/show_page/ShowPageLayout.jsx';
import GameHelper from './GameHelper.jsx';

/**
 * Rendering helper for the game creation page.
 */
export default class GameNewHelper {
  /**
   * Render the game creation form.
   *
   * @param {{name: string, description: string, gameType: string,
   *   status: string, fieldErrors: object}} formState - Form state.
   * @param {{onSubmit: Function, onNameChange: Function,
   *   onDescriptionChange: Function, onGameTypeChange: Function}} handlers - Event handlers.
   * @returns {React.ReactElement} Rendered new game page.
   */
  static render(formState, handlers) {
    return (
      <ShowPageLayout
        type="game"
        mode="new"
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
