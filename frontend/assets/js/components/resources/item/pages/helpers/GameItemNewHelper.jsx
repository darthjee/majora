import ShowPageLayout from '../../../../common/show_page/ShowPageLayout.jsx';

/**
 * Rendering helper for the game-level item creation page (issue #784). A thin wrapper around the
 * shared `item`/`new` `showTypeConfig` entry (issue #738) — the same form
 * `CharacterItemNewHelper` renders for the PC/NPC item creation flow — kept as its own class so a
 * page with no owning character doesn't render through a `Character`-named helper.
 */
export default class GameItemNewHelper {
  /**
   * Render the item creation form through `ShowPageLayout`: `name` (plain text field),
   * `description` (a plain textarea), `hidden` (a switch), and a deferred photo picker
   * (`ItemPhoto`'s `New` variant) in the left column — no links/money fields.
   *
   * @param {{name: string, description: string, hidden: boolean, status: string,
   *   fieldErrors: object, photo_path: string|null}} formState - Form state.
   * @param {{onSubmit: Function, onNameChange: Function, onDescriptionChange: Function,
   *   onHiddenChange: Function, onOpenUploadModal: Function, onRetryPhotoUpload: Function,
   *   onSkipPhotoUpload: Function}} handlers - Event handlers.
   * @returns {React.ReactElement} Rendered new item page.
   */
  static render(formState, handlers) {
    return (
      <ShowPageLayout
        type="item"
        mode="new"
        context={{ ...formState, handlers }}
      />
    );
  }
}
