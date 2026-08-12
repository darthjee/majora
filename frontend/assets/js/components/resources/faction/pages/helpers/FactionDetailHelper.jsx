import React from 'react';
import EditButton from '../../../../common/buttons/EditButton.jsx';
import ConditionalComponent from '../../../../common/misc/ConditionalComponent.jsx';
import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import ShowPageLayout from '../../../../common/show_page/ShowPageLayout.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the game faction detail page (issue #812), mirroring
 * `PossessionDetailHelper`/`ItemDetailHelper` minus the "Give Item"/acquisition affordance
 * (`Faction` has no character-ownership concept — the `Character.factions` M2M field has no
 * frontend UI in this issue).
 */
export default class FactionDetailHelper {
  /**
   * Render the faction detail view through `ShowPageLayout`: a back button, then a two-column
   * row with the faction's photo/name on the left (the right column renders nothing on `Show`
   * mode — `Faction` has no other field to display).
   *
   * @param {object} faction - Faction data object.
   * @param {string} faction.name - Faction name.
   * @param {string|null} [faction.photo_path] - Faction photo URL, or null/undefined to fall
   *   back to the default faction placeholder image.
   * @param {string} backHref - Hash path to the faction's parent list page.
   * @param {string} editHref - Hash path to the faction's edit page.
   * @param {boolean} [canEdit] - Whether the current user may edit this faction, gating the Edit
   *   button rendered alongside the back button. Defaults to `false`.
   * @param {boolean} [canUploadPhoto] - Whether the current user may upload a new photo. Defaults
   *   to `false`.
   * @param {Function} [onUploadClick] - Handler invoked when the upload button is clicked.
   * @returns {React.ReactElement} Faction detail element.
   */
  static render(faction, backHref, editHref, canEdit = false, canUploadPhoto = false, onUploadClick) {
    return (
      <ShowPageLayout
        type="faction"
        mode="show"
        backHref={backHref}
        pageActions={FactionDetailHelper.#renderPageActions(editHref, canEdit)}
        context={{ ...faction, canUploadPhoto, handlers: { onOpenUploadModal: onUploadClick } }}
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
