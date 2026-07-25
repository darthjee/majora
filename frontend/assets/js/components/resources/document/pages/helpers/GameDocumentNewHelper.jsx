import ShowPageLayout from '../../../../common/show_page/ShowPageLayout.jsx';

/**
 * Rendering helper for the game-level document creation page (issue #758, deferred photo picker
 * added in #727). A thin wrapper around the shared `document`/`new` `showTypeConfig` entry,
 * mirroring `GameItemNewHelper`.
 */
export default class GameDocumentNewHelper {
  /**
   * Render the document creation form through `ShowPageLayout`: `name` (plain text field),
   * `description` (a markdown editor), `hidden` (a switch), and a deferred photo picker
   * (`DocumentPhoto`'s `New` variant) in the left column — no links/money fields.
   *
   * @param {{name: string, description: string, hidden: boolean, status: string,
   *   fieldErrors: object, photo_path: string|null}} formState - Form state.
   * @param {{onSubmit: Function, onNameChange: Function, onDescriptionChange: Function,
   *   onHiddenChange: Function, onOpenUploadModal: Function, onRetryPhotoUpload: Function,
   *   onSkipPhotoUpload: Function}} handlers - Event handlers.
   * @returns {React.ReactElement} Rendered new document page.
   */
  static render(formState, handlers) {
    return (
      <ShowPageLayout
        type="document"
        mode="new"
        context={{ ...formState, handlers }}
      />
    );
  }
}
