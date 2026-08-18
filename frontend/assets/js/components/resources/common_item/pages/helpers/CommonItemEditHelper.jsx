import React from 'react';
import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import ShowPageLayout from '../../../../common/show_page/ShowPageLayout.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the game common item edit page (issue #826), mirroring
 * `PossessionEditHelper`. Wires the existing `dimmed`/`ActionsOverlay` mechanic onto
 * `type="commonItem"`, dimming the photo whenever the `hidden` switch is on.
 */
export default class CommonItemEditHelper {
  /**
   * Render the common item edit form through `ShowPageLayout`: a left column with the photo
   * (upload action button, dimmed when `hidden` is on) and the `hidden` switch, and a right
   * column with the title, `name`/`description`/`price`/`category` fields, and the submit
   * button.
   *
   * @param {{name: string, description: string, price: string|number, category: string,
   *   hidden: boolean, photo_path: (string|null), status: string, fieldErrors: object}} state -
   *   Form state.
   * @param {{onSubmit: Function, onNameChange: Function, onDescriptionChange: Function,
   *   onCategoryChange: Function, onHiddenChange: Function, onOpenUploadModal: Function,
   *   onOpenPriceModal: Function}} handlers - Event handlers.
   * @returns {React.ReactElement} Rendered common item edit form.
   */
  static render(state, handlers) {
    return (
      <ShowPageLayout
        type="commonItem"
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
    return <LoadingMessage message={Translator.t('common_item_page.loading')} />;
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
