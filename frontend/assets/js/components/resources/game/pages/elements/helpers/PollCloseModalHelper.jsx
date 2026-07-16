import Modal from 'react-bootstrap/cjs/Modal.js';
import Form from 'react-bootstrap/cjs/Form.js';
import Translator from '../../../../../../i18n/Translator.js';
import FieldErrors from '../../../../../common/FieldErrors.jsx';
import PollOptionValue from '../PollOptionValue.jsx';

const WINNER_BG_CLASS = 'bg-success-subtle';
const TIED_LOSER_BG_CLASS = 'bg-danger-subtle';

/**
 * Renders the poll close confirmation modal shell: the confirm message, the
 * "Override Decision" switch, either the auto-picked-winner preview or the
 * radio-selectable override list, and the submit/cancel actions.
 */
export default class PollCloseModalHelper {
  /**
   * Renders the poll close confirmation modal.
   *
   * @param {boolean} show - Whether the modal is visible.
   * @param {object} poll - Poll being closed.
   * @param {number} poll.id - Poll id.
   * @param {string} poll.title - Poll title.
   * @param {string} [poll.option_type] - Poll option type (`'text'` or `'date'`).
   * @param {{id: number, option: string}[]} [poll.options] - Poll options.
   * @param {object} state - Modal state.
   * @param {boolean} state.override - Whether "Override Decision" is on.
   * @param {number[]} state.maxVoteOptionIds - Option id(s) currently tied for the most votes.
   * @param {number|null} state.effectiveWinnerId - Auto-picked winner id (lowest id on a tie).
   * @param {number|null} state.selectedOptionId - Radio-selected option id in override mode.
   * @param {string} state.status - Submission status (`'idle'`, `'submitting'`, or `'error'`).
   * @param {object} handlers - Modal event handlers.
   * @param {Function} handlers.onCancel - Closes the modal without effect.
   * @param {Function} handlers.onToggleOverride - Toggles "Override Decision".
   * @param {Function} handlers.onSelectOption - Called with an option id when its radio is picked.
   * @param {Function} handlers.onSubmit - Submits the close request.
   * @returns {React.ReactElement} Rendered poll close confirmation modal.
   */
  static render(show, poll, state, handlers) {
    const options = poll.options ?? [];

    return (
      <Modal show={show} onHide={handlers.onCancel}>
        <Modal.Header closeButton>
          <Modal.Title>{Translator.t('game_poll_page.close_modal_title')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            {Translator.t('game_poll_page.close_confirm_message')}
            {' '}
            <strong>{poll.title}</strong>
          </p>
          {PollCloseModalHelper.#renderError(state)}
          <Form.Check
            id="poll-close-modal-override"
            type="switch"
            className="mb-3"
            label={Translator.t('game_poll_page.override_decision_label')}
            checked={state.override}
            onChange={handlers.onToggleOverride}
          />
          {state.override
            ? PollCloseModalHelper.#renderOverrideOptions(options, poll, state, handlers)
            : PollCloseModalHelper.#renderAutoOptions(options, poll, state)}
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary" type="button" onClick={handlers.onCancel}>
            {Translator.t('game_poll_page.close_cancel')}
          </button>
          <button
            className="btn btn-danger"
            type="button"
            disabled={PollCloseModalHelper.#isSubmitDisabled(state)}
            onClick={handlers.onSubmit}
          >
            {Translator.t('game_poll_page.close_submit')}
          </button>
        </Modal.Footer>
      </Modal>
    );
  }

  static #isSubmitDisabled(state) {
    if (state.status === 'submitting') {
      return true;
    }

    return state.override && !state.selectedOptionId;
  }

  static #renderError(state) {
    if (state.status !== 'error') {
      return null;
    }

    return <FieldErrors errors={[Translator.t('game_poll_page.close_error')]} />;
  }

  static #renderAutoOptions(options, poll, state) {
    const isTie = state.maxVoteOptionIds.length > 1;

    return (
      <>
        {isTie && (
          <div className="alert alert-warning">{Translator.t('game_poll_page.close_tie_alert')}</div>
        )}
        <ul className="list-group">
          {options.map((option) => (
            <li
              key={option.id}
              className={`list-group-item ${PollCloseModalHelper.#autoOptionClass(option, state)}`}
            >
              <PollOptionValue optionType={poll.option_type} value={option.option} />
            </li>
          ))}
        </ul>
      </>
    );
  }

  static #autoOptionClass(option, state) {
    if (option.id === state.effectiveWinnerId) {
      return WINNER_BG_CLASS;
    }
    if (state.maxVoteOptionIds.includes(option.id)) {
      return TIED_LOSER_BG_CLASS;
    }
    return '';
  }

  static #renderOverrideOptions(options, poll, state, handlers) {
    return (
      <ul className="list-group">
        {options.map((option) => PollCloseModalHelper.#renderOverrideOption(option, poll, state, handlers))}
      </ul>
    );
  }

  static #renderOverrideOption(option, poll, state, handlers) {
    const inputId = `poll-close-modal-option-${option.id}`;
    const hintClass = state.maxVoteOptionIds.includes(option.id) ? WINNER_BG_CLASS : '';

    return (
      <li key={option.id} className={`list-group-item form-check ${hintClass}`}>
        <input
          id={inputId}
          type="radio"
          className="form-check-input me-2"
          name={`poll-close-${poll.id}`}
          checked={state.selectedOptionId === option.id}
          onChange={() => handlers.onSelectOption(option.id)}
        />
        <label className="form-check-label" htmlFor={inputId}>
          <PollOptionValue optionType={poll.option_type} value={option.option} />
        </label>
      </li>
    );
  }
}
