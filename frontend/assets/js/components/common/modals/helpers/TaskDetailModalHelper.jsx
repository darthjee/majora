import Modal from 'react-bootstrap/cjs/Modal.js';
import Translator from '../../../../i18n/Translator.js';

/**
 * Renders the task detail (view/edit) modal shell.
 */
export default class TaskDetailModalHelper {
  /**
   * Renders the task detail modal.
   *
   * @param {boolean} show - Whether the modal is visible.
   * @param {object} state - Modal state.
   * @param {object|null} state.task - Task being viewed/edited, or null when none is selected.
   * @param {boolean} state.editing - Whether the modal is in edit mode.
   * @param {string} state.shortDescription - Current (possibly edited) short description.
   * @param {string} state.longDescription - Current (possibly edited) long description.
   * @param {object} handlers - Modal event handlers (`onClose`, `onEdit`, `onCancel`, `onSave`,
   *   `onShortDescriptionChange`, `onLongDescriptionChange`).
   * @returns {React.ReactElement} Rendered task detail modal.
   */
  static render(show, state, handlers) {
    return (
      <Modal show={show} onHide={handlers.onClose}>
        <Modal.Header closeButton>
          <Modal.Title>{Translator.t('game_task_edit_modal.title')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {state.editing
            ? TaskDetailModalHelper.#renderEditForm(state, handlers)
            : TaskDetailModalHelper.#renderView(state)}
        </Modal.Body>
        <Modal.Footer>
          {state.editing
            ? TaskDetailModalHelper.#renderEditActions(handlers)
            : TaskDetailModalHelper.#renderViewActions(handlers)}
        </Modal.Footer>
      </Modal>
    );
  }

  static #renderView(state) {
    return <p style={{ whiteSpace: 'pre-wrap' }}>{state.task?.long_description}</p>;
  }

  static #renderViewActions(handlers) {
    return (
      <button type="button" className="btn btn-primary" onClick={handlers.onEdit}>
        {Translator.t('game_task_edit_modal.edit')}
      </button>
    );
  }

  static #renderEditForm(state, handlers) {
    return (
      <>
        <div className="mb-3">
          <label className="form-label" htmlFor="task-detail-short-description">
            {Translator.t('game_task_edit_modal.short_description_label')}
          </label>
          <input
            id="task-detail-short-description"
            type="text"
            className="form-control"
            value={state.shortDescription}
            onChange={(event) => handlers.onShortDescriptionChange(event.target.value)}
          />
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="task-detail-long-description">
            {Translator.t('game_task_edit_modal.long_description_label')}
          </label>
          <textarea
            id="task-detail-long-description"
            className="form-control"
            value={state.longDescription}
            onChange={(event) => handlers.onLongDescriptionChange(event.target.value)}
          />
        </div>
      </>
    );
  }

  static #renderEditActions(handlers) {
    return (
      <>
        <button type="button" className="btn btn-secondary" onClick={handlers.onCancel}>
          {Translator.t('game_task_edit_modal.cancel')}
        </button>
        <button type="button" className="btn btn-primary" onClick={handlers.onSave}>
          {Translator.t('game_task_edit_modal.save')}
        </button>
      </>
    );
  }
}
