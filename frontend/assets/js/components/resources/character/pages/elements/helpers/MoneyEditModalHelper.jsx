import Modal from 'react-bootstrap/cjs/Modal.js';
import Translator from '../../../../../../i18n/Translator.js';
import FormField from '../../../../../common/FormField.jsx';

const DENOMINATION_ROWS = [
  { key: 'cp', labelKey: 'money.copper_piece' },
  { key: 'sp', labelKey: 'money.silver_piece' },
  { key: 'gp', labelKey: 'money.gold_piece' },
  { key: 'pp', labelKey: 'money.platinum_piece' },
  { key: 'gems', labelKey: 'money.gp_in_gems' },
];

/**
 * Renders the "Edit money" modal shell: one numeric input row per coin
 * denomination, and Confirm/Cancel footer actions.
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
   * @returns {React.ReactElement} Rendered money edit modal.
   */
  static render(show, state, handlers) {
    return (
      <Modal show={show} onHide={handlers.onClose}>
        <Modal.Header closeButton>
          <Modal.Title>{Translator.t('money_edit_modal.title')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {DENOMINATION_ROWS.map((row) => MoneyEditModalHelper.#renderRow(row, state, handlers))}
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
