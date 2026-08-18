import React from 'react';
import FieldErrors from '../../../../../common/forms/FieldErrors.jsx';
import TreasureMoney from '../../../../../common/misc/TreasureMoney.jsx';
import Translator from '../../../../../../i18n/Translator.js';

const LABEL_KEYS = {
  new: 'common_item_new_page.price_label',
  edit: 'common_item_edit_page.price_label',
};

/**
 * Show-mode right-column slot: the common item's price, displayed via `TreasureMoney` (issue
 * #826) — `price` follows the same convention as `Treasure.value` (an implicit single currency,
 * no separate currency/unit field), so it's rendered through the existing
 * `TreasureMoney`/`TreasureMoneyHelper` + `MoneyModelRegistry` machinery, reusing the default
 * (`dnd`) currency model — `GameCommonItem` carries no `game_type` field of its own to pick a
 * different one.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {number} [context.price] - Common item price, in the currency's lowest denomination.
 * @returns {React.ReactElement} Price display element.
 */
function CommonItemPriceFieldShow({ price }) {
  return (
    <p>
      <strong>{Translator.t('common_item_new_page.price_label')}</strong>
      {': '}
      <TreasureMoney value={price ?? 0} />
    </p>
  );
}

/**
 * New/edit-mode right-column slot: the common item's collapsed price field, paired with a button
 * that opens the price-editing modal (`MoneyEditModal`, wired by the owning page with
 * `context="treasure"` — `Treasure.value`'s own money context already fits `GameCommonItem.price`
 * exactly, per `DndMoneyModel`'s `CONTEXT_CONFIGS`), mirroring `TreasureValueFieldSlot`.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {'new'|'edit'} context.mode - Current page mode.
 * @param {string|number} context.price - Current price field value.
 * @param {object} [context.fieldErrors] - Field-level submission errors, keyed by field name.
 * @param {{onOpenPriceModal: Function}} context.handlers - Event handlers.
 * @returns {React.ReactElement} Price form field.
 */
function CommonItemPriceFieldEdit({
  mode, price, fieldErrors = {}, handlers,
}) {
  return (
    <div className="mb-3">
      <label className="form-label">{Translator.t(LABEL_KEYS[mode])}</label>
      <div><TreasureMoney value={Number(price) || 0} /></div>
      <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handlers.onOpenPriceModal}>
        {Translator.t(LABEL_KEYS[mode])}
      </button>
      <FieldErrors errors={fieldErrors.price ?? []} />
    </div>
  );
}

/**
 * Mode-variant price slot for the common item show/new/edit pages.
 */
const CommonItemPriceField = {
  Show: CommonItemPriceFieldShow, New: CommonItemPriceFieldEdit, Edit: CommonItemPriceFieldEdit,
};

export default CommonItemPriceField;
