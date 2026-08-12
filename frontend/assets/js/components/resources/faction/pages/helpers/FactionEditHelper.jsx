import React from 'react';
import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import ShowPageLayout from '../../../../common/show_page/ShowPageLayout.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the game faction edit page (issue #812), mirroring
 * `PossessionEditHelper`/`ItemEditHelper` minus the `hidden`/`description` fields — `Faction`
 * only has `name`/`photo_path`.
 */
export default class FactionEditHelper {
  /**
   * Render the faction edit form through `ShowPageLayout`: a left column with the (always
   * editable) photo, and a right column with the title, `name` field, and the submit button.
   *
   * @param {{name: string, photo_path: (string|null), status: string, fieldErrors: object}} state -
   *   Form state.
   * @param {{onSubmit: Function, onNameChange: Function, onOpenUploadModal: Function}} handlers -
   *   Event handlers.
   * @returns {React.ReactElement} Rendered faction edit form.
   */
  static render(state, handlers) {
    return (
      <ShowPageLayout
        type="faction"
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
    return <LoadingMessage message={Translator.t('faction_page.loading')} />;
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
