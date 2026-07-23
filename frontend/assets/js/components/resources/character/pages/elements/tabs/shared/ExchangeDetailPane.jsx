import CardTreasureImage from '../../../../../../common/cards/CardTreasureImage.jsx';
import TreasureMoney from '../../../../../../common/misc/TreasureMoney.jsx';
import Translator from '../../../../../../../i18n/Translator.js';

function renderActionError(actionError) {
  if (!actionError) {
    return null;
  }

  return <div className="alert alert-danger">{Translator.t(actionError)}</div>;
}

/**
 * Shared two-column detail-pane markup for a selected treasure, rendered alongside the still-
 * visible browse list by both {@link BuyTreasureTab} and {@link SellTreasureTab} (issue #811) —
 * image, name, value, "already owned" count, a quantity input, and a `Confirm`/`Cancel` button
 * pair at the bottom (`Cancel` returns to the listing without submitting).
 *
 * @param {object} props - Component props.
 * @param {object} props.selected - Currently selected browse item (`name`, `value`, `photo_path`).
 * @param {number} props.quantity - Quantity to buy/sell for the selected item.
 * @param {number} props.owned - Quantity of this treasure already owned by the character.
 * @param {number} [props.maxQuantity] - Maximum allowed quantity (sell only; `undefined` for buy,
 *   which has no upper bound besides affordability).
 * @param {boolean} props.submitting - Whether a buy/sell request is in flight.
 * @param {string} props.actionError - Translation key for the current action error, if any.
 * @param {string} [props.gameType] - Currency model name (e.g. `dnd`, `deadlands`) used to render
 *   the selected treasure's value. Defaults to `dnd`.
 * @param {Function} props.onQuantityChange - Called with the new quantity (number) on input change.
 * @param {Function} props.onConfirm - Called when the `Confirm` button is clicked.
 * @param {Function} props.onCancel - Called when the `Cancel` button is clicked, returning to the
 *   listing without submitting.
 * @returns {React.ReactElement} Rendered detail pane.
 */
export default function ExchangeDetailPane({
  selected, quantity, owned, maxQuantity, submitting, actionError, gameType = 'dnd',
  onQuantityChange, onConfirm, onCancel,
}) {
  return (
    <div>
      <div className="d-flex align-items-center mb-3">
        <div style={{ width: '96px' }}>
          <CardTreasureImage url={selected.photo_path} alt={selected.name} />
        </div>
        <div className="ms-3">
          <h5>{selected.name}</h5>
          <p className="mb-1"><TreasureMoney value={selected.value} gameType={gameType} /></p>
          <p className="text-muted mb-0">
            {Translator.t('treasure_exchange_modal.already_owned').replace('{{quantity}}', owned)}
          </p>
        </div>
      </div>
      {renderActionError(actionError)}
      <div className="mb-3">
        <label className="form-label" htmlFor="treasure-exchange-quantity">
          {Translator.t('treasure_exchange_modal.quantity_label')}
        </label>
        <input
          id="treasure-exchange-quantity"
          type="number"
          min="1"
          max={maxQuantity}
          className="form-control"
          value={quantity}
          onChange={(event) => onQuantityChange(Number(event.target.value))}
        />
      </div>
      <div className="d-flex gap-2">
        <button type="button" className="btn btn-primary" onClick={onConfirm} disabled={submitting}>
          {Translator.t('treasure_exchange_modal.confirm')}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          {Translator.t('treasure_exchange_modal.cancel_selection')}
        </button>
      </div>
    </div>
  );
}
