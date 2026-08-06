import OverlayTrigger from 'react-bootstrap/cjs/OverlayTrigger.js';
import Tooltip from 'react-bootstrap/cjs/Tooltip.js';
import Icons from '../../../../../../utils/ui/Icons.js';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Rendering helper for a single row of the give-treasure modal's (issue #1001) right-side
 * "receiving" list: the character's name/type, its already-owned and pending-to-give quantities
 * (each carrying an explanatory tooltip), the increment/decrement icons for the pending quantity,
 * and the remove-character icon — every icon wrapped in `OverlayTrigger`/`Tooltip`, matching
 * `ReceivingRowHelper`'s (the item version's) own tooltip usage. Kept as its own file (rather
 * than a private method on `GiveTreasureModalHelper`) since it is rendered once per row from a
 * `.map()`, a self-contained enough unit to be tested independently. Unlike `ReceivingRowHelper`,
 * a row's outcome may also carry a partial-fulfillment notice (surfaced instead of the generic
 * success message) when the server granted fewer units than requested.
 */
export default class TreasureReceivingRowHelper {
  /**
   * Renders one receiving-list row.
   *
   * @param {object} row - Receiving-list entry.
   * @param {object} row.character - The receiving character (`id`, `name`).
   * @param {string} row.kind - Character kind (`'pcs'` or `'npcs'`).
   * @param {number} row.ownedQuantity - How many of the treasure the character already owns.
   * @param {number} row.pendingQuantity - How many units will be given to the character.
   * @param {string|null} [row.result] - Outcome of the last submit for this row (`'success'`,
   *   `'failure'`, or `null` before any submit has happened).
   * @param {string} [row.partialNotice] - Translated notice shown instead of the generic success
   *   message when the last submit granted fewer units than requested.
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
              {Translator.t(row.kind === 'pcs' ? 'give_treasure_modal.pc_tab' : 'give_treasure_modal.npc_tab')}
            </span>
          </div>
          {TreasureReceivingRowHelper.#renderResult(row)}
        </div>
        <div className="d-flex align-items-center gap-3">
          {TreasureReceivingRowHelper.#renderQuantity('owned_quantity_tooltip', row.ownedQuantity)}
          {TreasureReceivingRowHelper.#renderPendingQuantity(row, handlers)}
          {TreasureReceivingRowHelper.#renderIconButton(
            Icons.personX, 'give_treasure_modal.remove_character_tooltip',
            () => handlers.onRemove(row.kind, row.character.id),
          )}
        </div>
      </div>
    );
  }

  static #renderResult(row) {
    const { result, partialNotice, character } = row;

    if (!result) {
      return null;
    }

    if (result === 'failure') {
      const message = Translator.t('give_treasure_modal.result_failure').replace('{{name}}', character.name);
      return <small className="text-danger">{message}</small>;
    }

    if (partialNotice) {
      return <small className="text-warning">{partialNotice}</small>;
    }

    const message = Translator.t('give_treasure_modal.result_success').replace('{{name}}', character.name);
    return <small className="text-success">{message}</small>;
  }

  static #renderQuantity(tooltipKey, value) {
    return (
      <OverlayTrigger placement="top" overlay={<Tooltip>{Translator.t(`give_treasure_modal.${tooltipKey}`)}</Tooltip>}>
        <span className="d-inline-block">{value}</span>
      </OverlayTrigger>
    );
  }

  static #renderPendingQuantity(row, handlers) {
    return (
      <div className="d-flex align-items-center gap-1">
        {TreasureReceivingRowHelper.#renderIconButton(
          Icons.caretDownSquareFill, 'give_treasure_modal.decrement_tooltip',
          () => handlers.onDecrement(row.kind, row.character.id),
        )}
        {TreasureReceivingRowHelper.#renderQuantity('pending_quantity_tooltip', row.pendingQuantity)}
        {TreasureReceivingRowHelper.#renderIconButton(
          Icons.caretUpSquareFill, 'give_treasure_modal.increment_tooltip',
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
