import Modal from 'react-bootstrap/cjs/Modal.js';
import Form from 'react-bootstrap/cjs/Form.js';
import Collapse from 'react-bootstrap/cjs/Collapse.js';
import Translator from '../../../i18n/Translator.js';

const ROLES = ['dm', 'player', 'owner'];

/**
 * Renders the "view as" facade modal shell and form elements.
 */
export default class ViewAsModalHelper {
  /**
   * Renders the view-as modal.
   *
   * @param {boolean} show - Whether the modal is visible.
   * @param {{enabled: boolean, roles: string[]}} state - Modal state.
   * @param {{onCancel: Function, onSave: Function, onToggleEnabled: Function,
   *   onToggleRole: Function}} handlers - Modal event handlers.
   * @returns {React.ReactElement} Rendered view-as modal.
   */
  static render(show, state, handlers) {
    return (
      <Modal show={show} onHide={handlers.onCancel}>
        <Modal.Header closeButton>
          <Modal.Title>{Translator.t('view_as_modal.title')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {ViewAsModalHelper.#renderEnabledCheckbox(state, handlers)}
          <Collapse in={state.enabled}>
            <div>
              {ROLES.map((role) => ViewAsModalHelper.#renderRoleCheckbox(role, state, handlers))}
            </div>
          </Collapse>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary" type="button" onClick={handlers.onCancel}>
            {Translator.t('view_as_modal.cancel')}
          </button>
          <button className="btn btn-primary" type="button" onClick={handlers.onSave}>
            {Translator.t('view_as_modal.save')}
          </button>
        </Modal.Footer>
      </Modal>
    );
  }

  static #renderEnabledCheckbox(state, handlers) {
    return (
      <Form.Check
        id="view-as-modal-enabled"
        type="switch"
        className="mb-3"
        label={Translator.t('view_as_modal.enabled_label')}
        checked={state.enabled}
        onChange={handlers.onToggleEnabled}
      />
    );
  }

  static #renderRoleCheckbox(role, state, handlers) {
    const id = `view-as-modal-role-${role}`;

    return (
      <div className="form-check" key={role}>
        <input
          id={id}
          type="checkbox"
          className="form-check-input"
          checked={state.roles.includes(role)}
          onChange={() => handlers.onToggleRole(role)}
        />
        <label htmlFor={id} className="form-check-label">
          {Translator.t(`view_as_modal.role_${role}`)}
        </label>
      </div>
    );
  }
}
