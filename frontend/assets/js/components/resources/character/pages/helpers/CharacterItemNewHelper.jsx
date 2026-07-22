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
   * `description` (a plain textarea), and `hidden` (a switch) — no avatar/links/money fields,
   * since this form is just the three fields from the issue.
   *
   * @param {{name: string, description: string, hidden: boolean, status: string,
   *   fieldErrors: object}} formState - Form state.
   * @param {{onSubmit: Function, onNameChange: Function, onDescriptionChange: Function,
   *   onHiddenChange: Function}} handlers - Event handlers.
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
