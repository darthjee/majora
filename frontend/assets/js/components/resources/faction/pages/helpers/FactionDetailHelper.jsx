import React from 'react';
import EditButton from '../../../../common/buttons/EditButton.jsx';
import ConditionalComponent from '../../../../common/misc/ConditionalComponent.jsx';
import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import ShowPageLayout from '../../../../common/show_page/ShowPageLayout.jsx';
import Noop from '../../../../../utils/Noop.js';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the game faction detail page (issue #812, character-list panel and recruit
 * modal added in #943), mirroring `PossessionDetailHelper`/`ItemDetailHelper`, minus the edit-form
 * fields `GameFaction` doesn't have (`description`/`hidden`).
 */
export default class FactionDetailHelper {
  /**
   * Render the faction detail view through `ShowPageLayout`: a back button (plus a Recruit button
   * when `canUploadPhoto` is true, mirroring `DocumentDetailHelper`'s own Give Document button
   * gating), then a two-column row with the faction's photo/name on the left and, on `Show` mode,
   * the character-list panel on the right (issue #943).
   *
   * @param {object} faction - Faction data object.
   * @param {string} faction.name - Faction name.
   * @param {string|null} [faction.photo_path] - Faction photo URL, or null/undefined to fall
   *   back to the default faction placeholder image.
   * @param {string} backHref - Hash path to the faction's parent list page.
   * @param {string} editHref - Hash path to the faction's edit page.
   * @param {boolean} [canEdit] - Whether the current user may edit this faction, gating the Edit
   *   button rendered alongside the back button. Defaults to `false`.
   * @param {boolean} [canUploadPhoto] - Whether the current user may upload a new photo; also
   *   gates the Recruit button, mirroring `DocumentDetailHelper`'s `canUploadPhoto`/Give Document
   *   button pairing. Defaults to `false`.
   * @param {string} [gameSlug] - Game slug the faction belongs to, merged into the rendering
   *   context as `game_slug` so the character-list panel can build its fetch params/hrefs.
   * @param {number} [refreshToken] - Opaque value bumped to re-trigger the character-list panel's
   *   fetch (e.g. after a successful recruit), merged into the rendering context.
   * @param {object} [handlers] - Event handlers.
   * @param {Function} [handlers.onUploadClick] - Handler invoked when the upload button is
   *   clicked.
   * @param {Function} [handlers.onRecruitClick] - Handler invoked when the Recruit button is
   *   clicked. Defaults to a no-op, matching the `canUploadPhoto` default.
   * @returns {React.ReactElement} Faction detail element.
   */
  static render(
    faction, backHref, editHref, canEdit = false, canUploadPhoto = false, gameSlug, refreshToken = 0, handlers = {},
  ) {
    const { onUploadClick, onRecruitClick = Noop.noop } = handlers;

    return (
      <ShowPageLayout
        type="faction"
        mode="show"
        backHref={backHref}
        pageActions={FactionDetailHelper.#renderPageActions(editHref, canEdit, canUploadPhoto, onRecruitClick)}
        context={{
          ...faction, canUploadPhoto, game_slug: gameSlug, refreshToken, handlers: { onOpenUploadModal: onUploadClick },
        }}
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

  static #renderPageActions(editHref, canEdit, canUploadPhoto, onRecruitClick) {
    return (
      <>
        <ConditionalComponent render={canUploadPhoto}>
          <button type="button" className="btn btn-primary mb-3" onClick={onRecruitClick}>
            {Translator.t('faction_page.recruit_button')}
          </button>
        </ConditionalComponent>
        <ConditionalComponent render={canEdit}>
          <EditButton href={editHref}>
            {Translator.t('character_page.edit')}
          </EditButton>
        </ConditionalComponent>
      </>
    );
  }
}
