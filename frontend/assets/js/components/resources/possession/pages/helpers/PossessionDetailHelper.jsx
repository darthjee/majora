import React from 'react';
import EditButton from '../../../../common/buttons/EditButton.jsx';
import ConditionalComponent from '../../../../common/misc/ConditionalComponent.jsx';
import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import ShowPageLayout from '../../../../common/show_page/ShowPageLayout.jsx';
import Noop from '../../../../../utils/Noop.js';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the game possession detail page (issue #1074), mirroring
 * `ItemDetailHelper` minus the "Give Item"/acquisition affordance (PC/NPC ownership is out of
 * scope here, tracked separately in #1076) via the `possession` `showTypeConfig` entry.
 */
export default class PossessionDetailHelper {
  /**
   * Render the possession detail view through `ShowPageLayout`: a back button, then a two-column
   * row with the possession's photo/name on the left and its description on the right.
   *
   * @param {object} possession - Possession data object (`GamePossession` shape).
   * @param {string} possession.name - Possession name.
   * @param {string} [possession.description] - Possession description.
   * @param {string|null} [possession.photo_path] - Possession photo URL, or null/undefined to
   *   fall back to the default possession placeholder image.
   * @param {boolean} [possession.hidden] - Whether the possession is hidden from players
   *   (DM/admin-facing data only, present only in the `/all.json`/`/full.json` variants).
   * @param {string} backHref - Hash path to the possession's parent list page.
   * @param {string} editHref - Hash path to the possession's edit page.
   * @param {boolean} [canEdit] - Whether the current user may edit this possession, gating the
   *   Edit button rendered alongside the back button. Defaults to `false`.
   * @param {boolean} [canUploadPhoto] - Whether the current user may upload a new photo. Defaults
   *   to `false`.
   * @param {Function} [onUploadClick] - Handler invoked when the upload button is clicked.
   *   Defaults to a no-op, matching the `canUploadPhoto` default.
   * @returns {React.ReactElement} Possession detail element.
   */
  static render(
    possession, backHref, editHref, canEdit = false, canUploadPhoto = false, onUploadClick = Noop.noop,
  ) {
    return (
      <ShowPageLayout
        type="possession"
        mode="show"
        backHref={backHref}
        pageActions={PossessionDetailHelper.#renderPageActions(editHref, canEdit)}
        context={{ ...possession, canUploadPhoto, handlers: { onOpenUploadModal: onUploadClick } }}
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
