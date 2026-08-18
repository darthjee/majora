import React from 'react';
import EditButton from '../../../../common/buttons/EditButton.jsx';
import ConditionalComponent from '../../../../common/misc/ConditionalComponent.jsx';
import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import ShowPageLayout from '../../../../common/show_page/ShowPageLayout.jsx';
import Noop from '../../../../../utils/Noop.js';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the game common item detail page (issue #826), mirroring
 * `PossessionDetailHelper` plus the `price`/`category` fields via the `commonItem`
 * `showTypeConfig` entry.
 */
export default class CommonItemDetailHelper {
  /**
   * Render the common item detail view through `ShowPageLayout`: a back button, then a
   * two-column row with the common item's photo/name on the left and its description/price/
   * category on the right.
   *
   * @param {object} commonItem - Common item data object (`GameCommonItem` shape).
   * @param {string} commonItem.name - Common item name.
   * @param {string} [commonItem.description] - Common item description.
   * @param {number} [commonItem.price] - Common item price, in the currency's lowest
   *   denomination.
   * @param {string} [commonItem.category] - Common item category.
   * @param {string|null} [commonItem.photo_path] - Common item photo URL, or null/undefined to
   *   fall back to the default common item placeholder image.
   * @param {boolean} [commonItem.hidden] - Whether the common item is hidden from players
   *   (DM/admin-facing data only, present only in the `/all.json`/`/full.json` variants).
   * @param {string} backHref - Hash path to the common item's parent list page.
   * @param {string} editHref - Hash path to the common item's edit page.
   * @param {boolean} [canEdit] - Whether the current user may edit this common item, gating the
   *   Edit button rendered alongside the back button. Defaults to `false`.
   * @param {boolean} [canUploadPhoto] - Whether the current user may upload a new photo. Defaults
   *   to `false`.
   * @param {Function} [onUploadClick] - Handler invoked when the upload button is clicked.
   *   Defaults to a no-op, matching the `canUploadPhoto` default.
   * @returns {React.ReactElement} Common item detail element.
   */
  static render(
    commonItem, backHref, editHref, canEdit = false, canUploadPhoto = false, onUploadClick = Noop.noop,
  ) {
    return (
      <ShowPageLayout
        type="commonItem"
        mode="show"
        backHref={backHref}
        pageActions={CommonItemDetailHelper.#renderPageActions(editHref, canEdit)}
        context={{ ...commonItem, canUploadPhoto, handlers: { onOpenUploadModal: onUploadClick } }}
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

  static #renderPageActions(editHref, canEdit) {
    return (
      <ConditionalComponent render={canEdit}>
        <EditButton href={editHref}>
          {Translator.t('character_page.edit')}
        </EditButton>
      </ConditionalComponent>
    );
  }
}
