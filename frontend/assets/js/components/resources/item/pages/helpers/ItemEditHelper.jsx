import React from 'react';
import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import ShowPageLayout from '../../../../common/show_page/ShowPageLayout.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the item edit pages (issue #766): shared by `GameItemEdit`,
 * `PcCharacterItemEdit`, and `NpcCharacterItemEdit`, since the layout and fields (`name`,
 * `description`, `hidden`) are identical across all three, via the `item` `showTypeConfig`
 * entry (issue #738). Wires the existing `dimmed`/`ActionsOverlay` mechanic (already used by
 * the Character edit pages) onto `type="item"`, dimming the photo whenever the `hidden` switch
 * is on.
 */
export default class ItemEditHelper {
  /**
   * Render the item edit form through `ShowPageLayout`: a left column with the photo (upload
   * action button, dimmed when `hidden` is on) and the `hidden` switch, and a right column with
   * the title, `name`/`description` fields, and the submit button.
   *
   * @param {{name: string, description: string, hidden: boolean, photo_path: (string|null),
   *   status: string, fieldErrors: object}} state - Form state.
   * @param {{onSubmit: Function, onNameChange: Function, onDescriptionChange: Function,
   *   onHiddenChange: Function, onOpenUploadModal: Function}} handlers - Event handlers.
   * @returns {React.ReactElement} Rendered item edit form.
   */
  static render(state, handlers) {
    return (
      <ShowPageLayout
        type="item"
        mode="edit"
        context={{ ...state, handlers }}
      />
    );
  }

  /**
   * Render the loading state.
   *
   * @returns {React.ReactElement} Loading message.
   */
  static renderLoading() {
    return <LoadingMessage message={Translator.t('item_page.loading')} />;
  }

  /**
   * Render the error state.
   *
   * @param {string} error - Error message.
   * @returns {React.ReactElement} Error alert.
   */
  static renderError(error) {
    return <ErrorAlert error={error} />;
  }
}
