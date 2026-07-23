import ShowPageLayout from '../../../../common/show_page/ShowPageLayout.jsx';

/**
 * Rendering helper for the PC/NPC item creation page (issue #714). Shared by both kinds, since
 * the form itself (`name`/`description`/`hidden`) has no PC/NPC-specific fields, via the `item`
 * `showTypeConfig` entry (issue #738) — the same entry `GameItemEdit`/`CharacterItemEdit` share
 * for editing.
 */
export default class CharacterItemNewHelper {
  /**
   * Render the item creation form through `ShowPageLayout`: `name` (plain text field),
   * `description` (a plain textarea), `hidden` (a switch), and a deferred photo picker
   * (`ItemPhoto`'s `New` variant) in the left column — no links/money fields, since this form is
   * just the item fields from the issue.
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
