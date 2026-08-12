import React from 'react';
import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import ShowPageLayout from '../../../../common/show_page/ShowPageLayout.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the game possession edit page (issue #1074), mirroring `ItemEditHelper`.
 * Wires the existing `dimmed`/`ActionsOverlay` mechanic onto `type="possession"`, dimming the
 * photo whenever the `hidden` switch is on.
 */
export default class PossessionEditHelper {
  /**
   * Render the possession edit form through `ShowPageLayout`: a left column with the photo
   * (upload action button, dimmed when `hidden` is on) and the `hidden` switch, and a right
   * column with the title, `name`/`description` fields, and the submit button.
   *
   * @param {{name: string, description: string, hidden: boolean, photo_path: (string|null),
   *   status: string, fieldErrors: object}} state - Form state.
   * @param {{onSubmit: Function, onNameChange: Function, onDescriptionChange: Function,
   *   onHiddenChange: Function, onOpenUploadModal: Function}} handlers - Event handlers.
   * @returns {React.ReactElement} Rendered possession edit form.
   */
  static render(state, handlers) {
    return (
      <ShowPageLayout
        type="possession"
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
    return <LoadingMessage message={Translator.t('possession_page.loading')} />;
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
