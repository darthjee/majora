import Modal from 'react-bootstrap/cjs/Modal.js';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Renders the kick confirmation modal shell (issue #1106), built directly on react-bootstrap's
 * `Modal`, matching `DeletePhotoConfirmModalHelper`/`SlainConfirmModalHelper`'s own shape.
 */
export default class KickConfirmModalHelper {
  /**
   * Renders the kick confirmation modal.
   *
   * @param {boolean} show - Whether the modal is visible.
   * @param {string} characterName - Name of the character pending removal.
   * @param {string} factionName - Name of the faction the character would be removed from.
   * @param {boolean} submitting - Whether the kick request is currently in flight.
   * @param {{onConfirm: Function, onCancel: Function}} handlers - Modal event handlers.
   * @returns {React.ReactElement} Rendered kick confirmation modal.
   */
  static render(show, characterName, factionName, submitting, handlers) {
    const body = Translator.t('kick_confirm_modal.body')
      .replace('{{character_name}}', characterName)
      .replace('{{faction_name}}', factionName);

    return (
      <Modal show={show} onHide={handlers.onCancel}>
        <Modal.Header closeButton>
          <Modal.Title>{Translator.t('kick_confirm_modal.title')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{body}</Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary" type="button" onClick={handlers.onCancel}>
            {Translator.t('kick_confirm_modal.cancel')}
          </button>
          <button
            className="btn btn-danger"
            type="button"
            onClick={handlers.onConfirm}
            disabled={submitting}
          >
            {Translator.t('kick_confirm_modal.confirm')}
          </button>
        </Modal.Footer>
      </Modal>
    );
  }
}
