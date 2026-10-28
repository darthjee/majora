import Modal from 'react-bootstrap/cjs/Modal.js';
import Translator from '../../../../../../i18n/Translator.js';

const INPUT_ID = 'clear-statistics-confirmation';

/**
 * Renders the clear-statistics typed-confirmation modal shell (issue #1685).
 */
export default class ClearStatisticsConfirmModalHelper {
  /**
   * Renders the clear-statistics confirmation modal.
   *
   * @param {boolean} show - Whether the modal is visible.
   * @param {{value: string, canConfirm: boolean}} state - Typed value and whether it confirms.
   * @param {{onChange: Function, onConfirm: Function, onCancel: Function}} handlers - Modal
   *   event handlers.
   * @returns {React.ReactElement} Rendered clear-statistics confirmation modal.
   */
  static render(show, { value, canConfirm }, handlers) {
    return (
      <Modal show={show} onHide={handlers.onCancel}>
        <Modal.Header closeButton>
          <Modal.Title>{Translator.t('clear_statistics_confirm_modal.title')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>{Translator.t('clear_statistics_confirm_modal.body')}</p>
          <p>{Translator.t('clear_statistics_confirm_modal.instruction')}</p>
          <label className="form-label" htmlFor={INPUT_ID}>
            {Translator.t('clear_statistics_confirm_modal.input_label')}
          </label>
          <input
            id={INPUT_ID}
            type="text"
            className="form-control"
            autoComplete="off"
            value={value}
            onChange={handlers.onChange}
          />
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary" type="button" onClick={handlers.onCancel}>
            {Translator.t('clear_statistics_confirm_modal.cancel')}
          </button>
          <button
            className="btn btn-danger"
            type="button"
            disabled={!canConfirm}
            onClick={handlers.onConfirm}
          >
            {Translator.t('clear_statistics_confirm_modal.confirm')}
          </button>
        </Modal.Footer>
      </Modal>
    );
  }
}
