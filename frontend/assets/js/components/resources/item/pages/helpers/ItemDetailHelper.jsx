import React from 'react';
import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import ShowPageLayout from '../../../../common/show_page/ShowPageLayout.jsx';
import Noop from '../../../../../utils/Noop.js';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the item detail pages (issue #724): shared by `GameItem`,
 * `PcCharacterItem`, and `NpcCharacterItem`, since the layout and fields (`name`,
 * `description`, `photo_path`, optional `hidden`) are identical across all three response
 * shapes, via the `item` `showTypeConfig` entry (issue #738).
 */
export default class ItemDetailHelper {
  /**
   * Render the item detail view through `ShowPageLayout`: a back button, then a two-column row
   * with the item's photo/name on the left and its description on the right.
   *
   * @param {object} item - Item data object (`GameItem` or `CharacterItem` shape).
   * @param {string} item.name - Item name.
   * @param {string} [item.description] - Item description.
   * @param {string|null} [item.photo_path] - Item photo URL, or null/undefined to fall back to
   *   the default item placeholder image.
   * @param {boolean} [item.hidden] - Whether the item is hidden from players (DM/admin-facing
   *   data only, present only in the `/all.json` variants).
   * @param {string} backHref - Hash path to the item's parent list page.
   * @param {boolean} [canUploadPhoto] - Whether the current user may upload a new photo.
   *   Defaults to `false` (today's behavior), used as-is by `CharacterItem`'s two callers which
   *   have no upload feature (issue #749 scope decision).
   * @param {Function} [onUploadClick] - Handler invoked when the upload button is clicked.
   *   Defaults to a no-op, matching the `canUploadPhoto` default.
   * @returns {React.ReactElement} Item detail element.
   */
  static render(item, backHref, canUploadPhoto = false, onUploadClick = Noop.noop) {
    return (
      <ShowPageLayout
        type="item"
        mode="show"
        backHref={backHref}
        context={{ ...item, canUploadPhoto, handlers: { onOpenUploadModal: onUploadClick } }}
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
