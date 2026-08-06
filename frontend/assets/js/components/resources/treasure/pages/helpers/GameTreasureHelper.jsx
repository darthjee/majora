import React from 'react';
import BackButton from '../../../../common/buttons/BackButton.jsx';
import ConditionalComponent from '../../../../common/misc/ConditionalComponent.jsx';
import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import Translator from '../../../../../i18n/Translator.js';
import TreasureMoney from '../../../../common/misc/TreasureMoney.jsx';
import TreasureListItem from '../../../../common/list_types/TreasureListItem.js';
import Noop from '../../../../../utils/Noop.js';

/**
 * Rendering helper for the game-scoped Treasure detail page (issue #1001, "Give Treasure" button
 * gating added in #1005). Mirrors `TreasureHelper.jsx`'s manual (non-`ShowPageLayout`) rendering
 * style, plus a "Give Treasure" button gated on `canUploadPhoto` (superuser/staff/dm/player of
 * the game, fixing its previously-unconditional visibility — every per-character grant is still
 * checked server-side by the reused acquire endpoint) and, when the treasure is capped
 * (`max_units` set), an availability line reusing `TreasureListItem#availabilityText` (the same
 * `available_units`/`max_units` display already used by `TreasureCardHelper`/the game treasures
 * list).
 */
export default class GameTreasureHelper {
  /**
   * Render the game treasure detail view.
   *
   * @param {object} treasure - Treasure data object.
   * @param {number} treasure.id - Treasure id.
   * @param {string} treasure.name - Treasure name.
   * @param {number} treasure.value - Treasure value.
   * @param {string} [treasure.game_type] - Currency model name (e.g. `dnd`, `deadlands`)
   *   determining which denominations the value is displayed in. Defaults to `dnd`.
   * @param {number|null} [treasure.available_units] - Units currently available within the
   *   game, when capped.
   * @param {number|null} [treasure.max_units] - Cap on units available within the game, or
   *   `null`/absent when uncapped.
   * @param {boolean} [treasure.can_edit] - Whether the current user can edit this treasure.
   * @param {string} backHref - Hash path to the game's treasures list.
   * @param {string} editHref - Hash path to the treasure's edit page.
   * @param {Function} [onGiveTreasureClick] - Handler invoked when the "Give Treasure" button is
   *   clicked. Defaults to a no-op.
   * @param {boolean} [canUploadPhoto] - Whether the current user may give this treasure, gating
   *   the "Give Treasure" button (issue #1005). Defaults to `false`.
   * @returns {React.ReactElement} Game treasure detail element.
   */
  static render(treasure, backHref, editHref, onGiveTreasureClick = Noop.noop, canUploadPhoto = false) {
    return (
      <div className="container mt-4">
        <BackButton href={backHref} />
        <h1>
          {treasure.name}
          {GameTreasureHelper.#renderEditLink(treasure, editHref)}
        </h1>
        <p className="mt-3">
          <strong>Value:</strong>
          {' '}
          <TreasureMoney value={treasure.value} gameType={treasure.game_type} />
        </p>
        {GameTreasureHelper.#renderAvailability(treasure)}
        <ConditionalComponent render={canUploadPhoto}>
          <button type="button" className="btn btn-primary mt-2" onClick={onGiveTreasureClick}>
            {Translator.t('give_treasure_modal.title')}
          </button>
        </ConditionalComponent>
      </div>
    );
  }

  /**
   * Render the loading state.
   *
   * @returns {React.ReactElement} Loading message.
   */
  static renderLoading() {
    return <LoadingMessage message={Translator.t('treasure_page.loading')} />;
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

  static #renderEditLink(treasure, editHref) {
    if (!treasure.can_edit) {
      return null;
    }

    return (
      <a href={editHref} className="btn btn-secondary ms-2">
        {Translator.t('treasure_page.edit')}
      </a>
    );
  }

  static #renderAvailability(treasure) {
    const label = new TreasureListItem(treasure).availabilityText;

    if (!label) {
      return null;
    }

    return <p className="text-muted">{label}</p>;
  }
}
