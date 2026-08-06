import OverlayTrigger from 'react-bootstrap/cjs/OverlayTrigger.js';
import Tooltip from 'react-bootstrap/cjs/Tooltip.js';
import Icons from '../../../../../../utils/ui/Icons.js';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Rendering helper for a single row of the give-document modal's (issue #1005) right-side
 * "receiving" list: the character's name/type, an already-owned indicator (with an explanatory
 * tooltip) when the character already owns the document, and the remove-character icon — every
 * icon wrapped in `OverlayTrigger`/`Tooltip`, matching `TreasureReceivingRowHelper`'s own tooltip
 * usage. Kept as its own file (rather than a private method on `GiveDocumentModalHelper`) since it
 * is rendered once per row from a `.map()`, a self-contained enough unit to be tested
 * independently. Unlike `TreasureReceivingRowHelper`, there is no pending-quantity concept — an
 * already-owned row is simply rendered grayed out (`text-muted`) instead of showing
 * increment/decrement controls, and remains removable from the list regardless of ownership.
 */
export default class DocumentReceivingRowHelper {
  /**
   * Renders one receiving-list row.
   *
   * @param {object} row - Receiving-list entry.
   * @param {object} row.character - The receiving character (`id`, `name`).
   * @param {string} row.kind - Character kind (`'pcs'` or `'npcs'`).
   * @param {boolean} row.owned - Whether the character already owns the document.
   * @param {string|null} [row.result] - Outcome of the last submit for this row (`'success'`,
   *   `'failure'`, or `null` before any submit has happened).
   * @param {object} handlers - Row event handlers.
   * @param {Function} handlers.onRemove - Called to remove the row entirely.
   * @returns {React.ReactElement} Rendered receiving-list row.
   */
  static render(row, handlers) {
    const rowClassName = `list-group-item d-flex justify-content-between align-items-center${row.owned ? ' text-muted' : ''}`;

    return (
      <div className={rowClassName} key={`${row.kind}:${row.character.id}`}>
        <div>
          <div>
            <strong>{row.character.name}</strong>
            {' '}
            <span className="badge bg-secondary">
              {Translator.t(row.kind === 'pcs' ? 'give_document_modal.pc_tab' : 'give_document_modal.npc_tab')}
            </span>
          </div>
          {DocumentReceivingRowHelper.#renderResult(row)}
        </div>
        <div className="d-flex align-items-center gap-3">
          {DocumentReceivingRowHelper.#renderOwnedIndicator(row.owned)}
          {DocumentReceivingRowHelper.#renderIconButton(
            Icons.personX, 'give_document_modal.remove_character_tooltip',
            () => handlers.onRemove(row.kind, row.character.id),
          )}
        </div>
      </div>
    );
  }

  static #renderResult(row) {
    const { result, character } = row;

    if (!result) {
      return null;
    }

    if (result === 'failure') {
      const message = Translator.t('give_document_modal.result_failure').replace('{{name}}', character.name);
      return <small className="text-danger">{message}</small>;
    }

    const message = Translator.t('give_document_modal.result_success').replace('{{name}}', character.name);
    return <small className="text-success">{message}</small>;
  }

  static #renderOwnedIndicator(owned) {
    if (!owned) {
      return null;
    }

    return (
      <OverlayTrigger
        placement="top"
        overlay={<Tooltip>{Translator.t('give_document_modal.already_owned_tooltip')}</Tooltip>}
      >
        <span className="d-inline-block">
          <i className={`bi ${Icons.checkCircleFill}`} aria-hidden="true"></i>
        </span>
      </OverlayTrigger>
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
