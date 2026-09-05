import Modal from 'react-bootstrap/cjs/Modal.js';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Translated title/body/confirm-label key suffixes for each confirmable recovery-token action,
 * mirroring `RecoveryTokenStatusBadges`'s `STATUS_VARIANTS` map pattern.
 *
 * @type {object}
 */
const TEXT_BY_ACTION = {
  delete: {
    title: 'delete_title',
    body: 'delete_body',
    confirm: 'delete_confirm',
  },
  'force-expire': {
    title: 'force_expire_title',
    body: 'force_expire_body',
    confirm: 'force_expire_confirm',
  },
};

/**
 * Renders the recovery-token action confirmation modal shell (issue #1249), following
 * `ClearCacheConfirmModalHelper`'s shape but parameterized by which action it confirms, since it
 * serves both `delete` and `force-expire`.
 */
export default class RecoveryTokenActionConfirmModalHelper {
  /**
   * Renders the recovery-token action confirmation modal.
   *
   * @param {boolean} show - Whether the modal is visible.
   * @param {string} action - The action being confirmed, `'delete'` or `'force-expire'`.
   * @param {{onConfirm: Function, onCancel: Function}} handlers - Modal event handlers.
   * @returns {React.ReactElement} Rendered recovery-token action confirmation modal.
   */
  static render(show, action, handlers) {
    const keys = TEXT_BY_ACTION[action];

    return (
      <Modal show={show} onHide={handlers.onCancel}>
        <Modal.Header closeButton>
          <Modal.Title>{Translator.t(`recovery_token_action_confirm_modal.${keys.title}`)}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{Translator.t(`recovery_token_action_confirm_modal.${keys.body}`)}</Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary" type="button" onClick={handlers.onCancel}>
            {Translator.t('recovery_token_action_confirm_modal.cancel')}
          </button>
          <button className="btn btn-danger" type="button" onClick={handlers.onConfirm}>
            {Translator.t(`recovery_token_action_confirm_modal.${keys.confirm}`)}
          </button>
        </Modal.Footer>
      </Modal>
    );
  }
}
