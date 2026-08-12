import ShowPageLayout from '../../../../common/show_page/ShowPageLayout.jsx';

/**
 * Rendering helper for the game-level possession creation page (issue #1074). A thin wrapper
 * around the shared `possession`/`new` `showTypeConfig` entry, mirroring `GameItemNewHelper`.
 */
export default class GamePossessionNewHelper {
  /**
   * Render the possession creation form through `ShowPageLayout`: `name` (plain text field),
   * `description` (a plain textarea), `hidden` (a switch), and a deferred photo picker
   * (`PossessionPhoto`'s `New` variant) in the left column — no links/money fields.
   *
   * @param {{name: string, description: string, hidden: boolean, status: string,
   *   fieldErrors: object, photo_path: string|null}} formState - Form state.
   * @param {{onSubmit: Function, onNameChange: Function, onDescriptionChange: Function,
   *   onHiddenChange: Function, onOpenUploadModal: Function, onRetryPhotoUpload: Function,
   *   onSkipPhotoUpload: Function}} handlers - Event handlers.
   * @returns {React.ReactElement} Rendered new possession page.
   */
  static render(formState, handlers) {
    return (
      <ShowPageLayout
        type="possession"
        mode="new"
        context={{ ...formState, handlers }}
      />
    );
  }
}
