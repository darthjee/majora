import Modal from 'react-bootstrap/cjs/Modal.js';
import Translator from '../../../../i18n/Translator.js';
import FormField from '../../forms/FormField.jsx';
import MoneyEditModalController from '../controllers/MoneyEditModalController.js';
import MoneyModelRegistry from '../../../../utils/money/MoneyModelRegistry.js';

/**
 * Renders the "Edit money" modal shell: one numeric input row per
 * denomination relevant to the given context and currency model, and
 * Confirm/Cancel footer actions.
 */
export default class MoneyEditModalHelper {
  /**
   * Renders the money edit modal.
   *
   * @param {boolean} show - Whether the modal is visible.
   * @param {object} state - Modal state.
   * @param {object} state.breakdown - Local per-denomination breakdown being edited.
   * @param {boolean} state.canConfirm - Whether every denomination is a non-negative integer.
   * @param {object} handlers - Modal event handlers (`onClose`, `onConfirm`, `onFieldChange`).
   * @param {string} [context] - Money context (`character` or `treasure`), determining which
   *   denomination rows are rendered.
   * @param {string} [gameType] - Currency model name (e.g. `dnd`, `deadlands`), determining
   *   which denominations exist. Defaults to `dnd`.
   * @returns {React.ReactElement} Rendered money edit modal.
   */
  static render(show, state, handlers, context = 'character', gameType = 'dnd') {
    const rows = MoneyEditModalHelper.#rowsFor(context, gameType);

    return (
      <Modal show={show} onHide={handlers.onClose}>
        <Modal.Header closeButton>
          <Modal.Title>{Translator.t('money_edit_modal.title')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {rows.map((row) => MoneyEditModalHelper.#renderRow(row, state, handlers))}
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="btn btn-secondary" onClick={handlers.onClose}>
            {Translator.t('money_edit_modal.cancel')}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!state.canConfirm}
            onClick={handlers.onConfirm}
          >
            {Translator.t('money_edit_modal.confirm')}
          </button>
        </Modal.Footer>
      </Modal>
    );
  }

  static #rowsFor(context, gameType) {
    const model = MoneyModelRegistry.resolve(gameType);

    return MoneyEditModalController.denominationKeys(context, gameType)
      .map((key) => ({ key, labelKey: model.labelKey(key) }));
  }

  static #renderRow(row, state, handlers) {
    const { key, labelKey } = row;

    return (
      <FormField
        key={key}
        id={`money-edit-${key}`}
        type="number"
        label={Translator.t(labelKey)}
        value={state.breakdown[key]}
        onChange={(event) => handlers.onFieldChange(key, event.target.value)}
      />
    );
  }
}
