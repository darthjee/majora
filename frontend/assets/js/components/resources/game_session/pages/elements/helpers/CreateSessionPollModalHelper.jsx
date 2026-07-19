import Modal from 'react-bootstrap/cjs/Modal.js';
import Translator from '../../../../../../i18n/Translator.js';
import RemovableOptionRow from '../../../../../common/forms/RemovableOptionRow.jsx';
import PollTypeRadioGroup from '../../../../../common/forms/PollTypeRadioGroup.jsx';
import { OPTION_TYPE_DATE } from '../../../../game/pages/elements/PollOptionType.js';

/**
 * Renders the "Create session poll" modal shell: a dynamically-growing list
 * of date option rows, an optional error message, and Confirm/Cancel footer
 * actions.
 */
export default class CreateSessionPollModalHelper {
  /**
   * Renders the create-session-poll modal.
   *
   * @param {boolean} show - Whether the modal is visible.
   * @param {object} state - Modal state.
   * @param {string[]} state.dates - Current dynamic dates list.
   * @param {string} state.type - Currently selected poll type (`single` or `multiple`).
   * @param {boolean} state.canConfirm - Whether at least one non-blank date is present.
   * @param {string} [state.error] - Error message to display, if any.
   * @param {object} handlers - Modal event handlers (`onClose`, `onConfirm`, `onDateChange`,
   *   `onDateRemove`, `onTypeChange`).
   * @returns {React.ReactElement} Rendered create-session-poll modal.
   */
  static render(show, state, handlers) {
    return (
      <Modal show={show} onHide={handlers.onClose}>
        <Modal.Header closeButton>
          <Modal.Title>{Translator.t('session_poll_modal.title')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {CreateSessionPollModalHelper.#renderError(state)}
          {CreateSessionPollModalHelper.#renderTypeField(state, handlers)}
          <span className="form-label d-block">{Translator.t('session_poll_modal.dates_label')}</span>
          {state.dates.map((date, index) => (
            CreateSessionPollModalHelper.#renderDate(date, index, state, handlers)
          ))}
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="btn btn-secondary" onClick={handlers.onClose}>
            {Translator.t('session_poll_modal.cancel')}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!state.canConfirm}
            onClick={handlers.onConfirm}
          >
            {Translator.t('session_poll_modal.confirm')}
          </button>
        </Modal.Footer>
      </Modal>
    );
  }

  static #renderError(state) {
    if (!state.error) {
      return null;
    }

    return <div className="alert alert-danger">{state.error}</div>;
  }

  static #renderTypeField(state, handlers) {
    return (
      <div className="mb-3">
        <span className="form-label d-block">{Translator.t('session_poll_modal.type_label')}</span>
        <PollTypeRadioGroup
          idPrefix="session-poll-type"
          name="session-poll-type"
          translationPrefix="session_poll_modal.type"
          value={state.type}
          onChange={handlers.onTypeChange}
        />
      </div>
    );
  }

  static #renderDate(date, index, state, handlers) {
    return (
      <RemovableOptionRow
        key={index}
        id={`session-poll-date-${index}`}
        testId={`session-poll-date-${index}`}
        removeTestId={`session-poll-date-remove-${index}`}
        optionType={OPTION_TYPE_DATE}
        value={date}
        isLast={index === state.dates.length - 1}
        onChange={(event) => handlers.onDateChange(index, event.target.value)}
        onRemove={() => handlers.onDateRemove(index)}
      />
    );
  }
}
