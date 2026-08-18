import ShowPageLayout from '../../../../common/show_page/ShowPageLayout.jsx';

/**
 * Rendering helper for the game-level common item creation page (issue #826). A thin wrapper
 * around the shared `commonItem`/`new` `showTypeConfig` entry, mirroring
 * `GamePossessionNewHelper`.
 */
export default class GameCommonItemNewHelper {
  /**
   * Render the common item creation form through `ShowPageLayout`: `name` (plain text field),
   * `description` (a plain textarea), `price` (a collapsed value field paired with a money edit
   * modal), `category` (a select), `hidden` (a switch), and a deferred photo picker
   * (`CommonItemPhoto`'s `New` variant) in the left column — no links field.
   *
   * @param {{name: string, description: string, price: string|number, category: string,
   *   hidden: boolean, status: string, fieldErrors: object, photo_path: string|null}} formState -
   *   Form state.
   * @param {{onSubmit: Function, onNameChange: Function, onDescriptionChange: Function,
   *   onCategoryChange: Function, onHiddenChange: Function, onOpenUploadModal: Function,
   *   onOpenPriceModal: Function, onRetryPhotoUpload: Function,
   *   onSkipPhotoUpload: Function}} handlers - Event handlers.
   * @returns {React.ReactElement} Rendered new common item page.
   */
  static render(formState, handlers) {
    return (
      <ShowPageLayout
        type="commonItem"
        mode="new"
        context={{ ...formState, handlers }}
      />
    );
  }
}
