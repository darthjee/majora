import ShowPageLayout from '../../../../common/show_page/ShowPageLayout.jsx';

/**
 * Rendering helper for the game-level document creation page (issue #758). A thin wrapper
 * around the shared `document`/`new` `showTypeConfig` entry, mirroring `GameItemNewHelper`.
 */
export default class GameDocumentNewHelper {
  /**
   * Render the document creation form through `ShowPageLayout`: `name` (plain text field),
   * `description` (a markdown editor), `hidden` (a switch) — no photo picker, no links/money
   * fields.
   *
   * @param {{name: string, description: string, hidden: boolean, status: string,
   *   fieldErrors: object}} formState - Form state.
   * @param {{onSubmit: Function, onNameChange: Function, onDescriptionChange: Function,
   *   onHiddenChange: Function}} handlers - Event handlers.
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
