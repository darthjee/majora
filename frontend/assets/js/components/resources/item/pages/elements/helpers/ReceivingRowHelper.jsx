import OverlayTrigger from 'react-bootstrap/cjs/OverlayTrigger.js';
import Tooltip from 'react-bootstrap/cjs/Tooltip.js';
import Icons from '../../../../../../utils/ui/Icons.js';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Rendering helper for a single row of the give-item modal's (issue #827) right-side "receiving"
 * list: the character's name/type, its already-owned and pending-to-create quantities (each
 * carrying an explanatory tooltip), the increment/decrement icons for the pending quantity, and
 * the remove-character icon — every icon wrapped in `OverlayTrigger`/`Tooltip`, matching
 * `ResourceExchangeModalHelper`'s existing tooltip usage. Kept as its own file (rather than a
 * private method on `GiveItemModalHelper`) since it is rendered once per row from a `.map()`, a
 * self-contained enough unit to be tested independently.
 */
export default class ReceivingRowHelper {
  /**
   * Renders one receiving-list row.
   *
   * @param {object} row - Receiving-list entry.
   * @param {object} row.character - The receiving character (`id`, `name`).
   * @param {string} row.kind - Character kind (`'pcs'` or `'npcs'`).
   * @param {number} row.ownedQuantity - How many of the item the character already owns.
   * @param {number} row.pendingQuantity - How many new copies will be created for the character.
   * @param {string|null} [row.result] - Outcome of the last submit for this row (`'success'`,
   *   `'failure'`, or `null` before any submit has happened).
   * @param {object} handlers - Row event handlers.
   * @param {Function} handlers.onIncrement - Called to increase the row's pending quantity.
   * @param {Function} handlers.onDecrement - Called to decrease the row's pending quantity.
   * @param {Function} handlers.onRemove - Called to remove the row entirely.
   * @returns {React.ReactElement} Rendered receiving-list row.
   */
  static render(row, handlers) {
    return (
      <div className="list-group-item d-flex justify-content-between align-items-center" key={`${row.kind}:${row.character.id}`}>
        <div>
          <div>
            <strong>{row.character.name}</strong>
            {' '}
            <span className="badge bg-secondary">
              {Translator.t(row.kind === 'pcs' ? 'give_item_modal.pc_tab' : 'give_item_modal.npc_tab')}
            </span>
          </div>
          {ReceivingRowHelper.#renderResult(row.result, row.character.name)}
        </div>
        <div className="d-flex align-items-center gap-3">
          {ReceivingRowHelper.#renderQuantity('owned_quantity_tooltip', row.ownedQuantity)}
          {ReceivingRowHelper.#renderPendingQuantity(row, handlers)}
          {ReceivingRowHelper.#renderIconButton(
            Icons.personX, 'give_item_modal.remove_character_tooltip', () => handlers.onRemove(row.kind, row.character.id),
          )}
        </div>
      </div>
    );
  }

  static #renderResult(result, characterName) {
    if (!result) {
      return null;
    }

    const className = result === 'success' ? 'text-success' : 'text-danger';
    const key = result === 'success' ? 'give_item_modal.result_success' : 'give_item_modal.result_failure';

    return <small className={className}>{Translator.t(key).replace('{{name}}', characterName)}</small>;
  }

  static #renderQuantity(tooltipKey, value) {
    return (
      <OverlayTrigger placement="top" overlay={<Tooltip>{Translator.t(`give_item_modal.${tooltipKey}`)}</Tooltip>}>
        <span className="d-inline-block">{value}</span>
      </OverlayTrigger>
    );
  }

  static #renderPendingQuantity(row, handlers) {
    return (
      <div className="d-flex align-items-center gap-1">
        {ReceivingRowHelper.#renderIconButton(
          Icons.caretDownSquareFill, 'give_item_modal.decrement_tooltip',
          () => handlers.onDecrement(row.kind, row.character.id),
        )}
        {ReceivingRowHelper.#renderQuantity('pending_quantity_tooltip', row.pendingQuantity)}
        {ReceivingRowHelper.#renderIconButton(
          Icons.caretUpSquareFill, 'give_item_modal.increment_tooltip',
          () => handlers.onIncrement(row.kind, row.character.id),
        )}
      </div>
    );
  }

  static #renderIconButton(icon, tooltipKey, onClick) {
    return (
      <OverlayTrigger placement="top" overlay={<Tooltip>{Translator.t(tooltipKey)}</Tooltip>}>
        <button type="button" className="btn btn-link p-0" onClick={onClick}>
          <i className={`bi ${icon}`}></i>
        </button>
      </OverlayTrigger>
    );
  }
}
