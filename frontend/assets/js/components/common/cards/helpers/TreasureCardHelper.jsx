import React from 'react';
import ActionsOverlay from '../../misc/ActionsOverlay.jsx';
import Badge from '../../badges/Badge.jsx';
import TooltipBadge from '../../badges/TooltipBadge.jsx';
import Translator from '../../../../i18n/Translator.js';
import Noop from '../../../../utils/Noop.js';
import TreasureMoney from '../../misc/TreasureMoney.jsx';
import Icons from '../../../../utils/ui/Icons.js';
import TreasureListItem from '../../list_types/TreasureListItem.js';

/**
 * Rendering helper for the TreasureCard element.
 */
export default class TreasureCardHelper {
  /**
   * Render a Bootstrap card for a treasure.
   *
   * @description The card body's title uses Bootstrap's `stretched-link`
   *   utility (rather than wrapping the whole card in an anchor) so the
   *   manage-only upload button and edit link can live alongside it without
   *   nesting interactive elements inside an interactive `<a>`.
   * @param {object} treasure - Treasure data object.
   * @param {number} treasure.id - Treasure ID.
   * @param {string} treasure.name - Treasure name.
   * @param {number} treasure.value - Treasure value.
   * @param {string} [treasure.game_type] - Currency model name (e.g. `dnd`, `deadlands`)
   *   determining which denominations the value is displayed in. Defaults to `dnd`.
   * @param {string|null} [treasure.photo_path] - Optional treasure photo path.
   * @param {number|null} [treasure.available_units] - Units currently available within the
   *   game, when the treasure is capped. `null`/absent when unlimited.
   * @param {number|null} [treasure.max_units] - Maximum units obtainable within the game, when
   *   the treasure is capped. `null`/absent when unlimited; when set, an availability line is
   *   shown in the card body.
   * @param {boolean} [treasure.hidden] - Whether the treasure is hidden from players for this
   *   game (DM/admin-facing data only); shown as a badge in the overlay's info bar when true.
   * @param {boolean} [canManage] - Whether the current user may upload a photo and edit this treasure.
   * @param {Function} [onUploadClick] - Handler invoked with the treasure when the upload button is clicked.
   * @param {string} [editHref] - Hash path to the treasure's edit page. When omitted, no edit
   *   link is rendered even if `canManage` is true.
   * @param {number|null} [quantity] - Owned quantity, rendered as a `×<quantity>` badge in the
   *   overlay's info bar when greater than 1, omitted entirely when 1 or unset.
   * @returns {React.ReactElement} Treasure card element.
   */
  static render(treasure, canManage = false, onUploadClick = Noop.noop, editHref = '', quantity = null) {
    return (
      <div className="col-6 col-sm-4 col-md-3 col-lg-2 mb-4">
        <div className="card h-100 position-relative">
          <ActionsOverlay
            type="treasure"
            url={treasure.photo_path}
            alt={treasure.name}
            canEdit={canManage}
            onClick={() => onUploadClick(treasure)}
            infoBarItems={TreasureCardHelper.buildInfoBarItems(treasure, quantity)}
          />
          <div className="card-body">
            <h6 className="card-title">
              <a
                href={`#/treasures/${treasure.id}`}
                className="stretched-link text-decoration-none text-dark"
              >
                {treasure.name}
              </a>
            </h6>
            <p className="card-text text-muted mb-0">
              <TreasureMoney value={treasure.value} gameType={treasure.game_type} />
            </p>
            {TreasureCardHelper.#renderAvailability(treasure)}
            {TreasureCardHelper.#renderEditLink(canManage, editHref)}
          </div>
        </div>
      </div>
    );
  }

  /**
   * Build the overlay's info-bar items: an optional Hidden badge (DM/admin-facing,
   * shown when `treasure.hidden` is true) followed by an optional quantity badge. Exposed
   * publicly (rather than kept private) so `listTypeConfig`'s `treasures` entry can reuse the
   * same item shape without duplicating it.
   *
   * @param {object} treasure - Treasure data object.
   * @param {boolean} [treasure.hidden] - Whether the treasure is hidden from players for this game.
   * @param {number|null} [quantity] - Owned quantity.
   * @returns {{key: string, label: React.ReactElement}[]} Info-bar item definitions.
   */
  static buildInfoBarItems(treasure, quantity) {
    return [
      ...TreasureCardHelper.#buildHiddenInfoBarItems(treasure),
      ...TreasureCardHelper.#buildQuantityInfoBarItems(quantity),
    ];
  }

  static #buildHiddenInfoBarItems(treasure) {
    if (!treasure.hidden) {
      return [];
    }

    return [{
      key: 'hidden',
      label: (
        <TooltipBadge
          icon={Icons.eyeSlashFill}
          items={[{
            icon: Icons.eyeSlashFill,
            text: Translator.t('game_treasures_page.hidden_label'),
            variant: null,
          }]}
        />
      ),
    }];
  }

  static #buildQuantityInfoBarItems(quantity) {
    if (!quantity || quantity <= 1) {
      return [];
    }

    return [{ key: 'quantity', label: <Badge text={`×${quantity}`} /> }];
  }

  static #renderAvailability(treasure) {
    const label = new TreasureListItem(treasure).availabilityText;

    if (!label) {
      return null;
    }

    return <p className="card-text text-muted small mb-0">{label}</p>;
  }

  static #renderEditLink(canManage, editHref) {
    if (!canManage || !editHref) {
      return null;
    }

    return (
      <a
        href={editHref}
        className="card-action-link btn btn-sm btn-outline-secondary mt-2"
      >
        {Translator.t('game_treasures_page.edit')}
      </a>
    );
  }
}
