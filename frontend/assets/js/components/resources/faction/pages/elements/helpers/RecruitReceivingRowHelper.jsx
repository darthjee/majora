import OverlayTrigger from 'react-bootstrap/cjs/OverlayTrigger.js';
import Tooltip from 'react-bootstrap/cjs/Tooltip.js';
import Icons from '../../../../../../utils/ui/Icons.js';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Rendering helper for a single row of the recruit modal's (issue #943) right-side "receiving"
 * list: the character's name/type, an already-enlisted indicator (with an explanatory tooltip)
 * when the character is already enlisted in the faction, and the remove-character icon — a 1:1
 * structural mirror of `DocumentReceivingRowHelper` (`owned` → `enlisted`).
 */
export default class RecruitReceivingRowHelper {
  /**
   * Renders one receiving-list row.
   *
   * @param {object} row - Receiving-list entry.
   * @param {object} row.character - The receiving character (`id`, `name`).
   * @param {string} row.kind - Character kind (`'pcs'` or `'npcs'`).
   * @param {boolean} row.enlisted - Whether the character is already enlisted in the faction.
   * @param {string|null} [row.result] - Outcome of the last submit for this row (`'success'`,
   *   `'failure'`, or `null` before any submit has happened).
   * @param {object} handlers - Row event handlers.
   * @param {Function} handlers.onRemove - Called to remove the row entirely.
   * @returns {React.ReactElement} Rendered receiving-list row.
   */
  static render(row, handlers) {
    const rowClassName = `list-group-item d-flex justify-content-between align-items-center${row.enlisted ? ' text-muted' : ''}`;

    return (
      <div className={rowClassName} key={`${row.kind}:${row.character.id}`}>
        <div>
          <div>
            <strong>{row.character.name}</strong>
            {' '}
            <span className="badge bg-secondary">
              {Translator.t(row.kind === 'pcs' ? 'recruit_modal.pc_tab' : 'recruit_modal.npc_tab')}
            </span>
          </div>
          {RecruitReceivingRowHelper.#renderResult(row)}
        </div>
        <div className="d-flex align-items-center gap-3">
          {RecruitReceivingRowHelper.#renderEnlistedIndicator(row.enlisted)}
          {RecruitReceivingRowHelper.#renderIconButton(
            Icons.personX, 'recruit_modal.remove_character_tooltip',
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
      const message = Translator.t('recruit_modal.result_failure').replace('{{name}}', character.name);
      return <small className="text-danger">{message}</small>;
    }

    const message = Translator.t('recruit_modal.result_success').replace('{{name}}', character.name);
    return <small className="text-success">{message}</small>;
  }

  static #renderEnlistedIndicator(enlisted) {
    if (!enlisted) {
      return null;
    }

    return (
      <OverlayTrigger
        placement="top"
        overlay={<Tooltip>{Translator.t('recruit_modal.already_enlisted_tooltip')}</Tooltip>}
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
