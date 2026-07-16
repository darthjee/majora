import PollCloseModalHelper
  from '../../../../../../../../../assets/js/components/resources/game/pages/elements/helpers/PollCloseModalHelper.jsx';
import Modal from 'react-bootstrap/cjs/Modal.js';
import Form from 'react-bootstrap/cjs/Form.js';

const findElement = (node, matcher) => {
  if (!node) {
    return null;
  }

  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findElement(child, matcher);

      if (match) {
        return match;
      }
    }

    return null;
  }

  if (typeof node !== 'object') {
    return null;
  }

  if (matcher(node)) {
    return node;
  }

  return findElement(node.props?.children, matcher);
};

const findAllElements = (node, matcher, found = []) => {
  if (!node) {
    return found;
  }

  if (Array.isArray(node)) {
    node.forEach((child) => findAllElements(child, matcher, found));
    return found;
  }

  if (typeof node !== 'object') {
    return found;
  }

  if (matcher(node)) {
    found.push(node);
  }

  findAllElements(node.props?.children, matcher, found);
  return found;
};

describe('PollCloseModalHelper', function() {
  const poll = {
    id: 1,
    title: 'Which tavern?',
    option_type: 'text',
    options: [{ id: 10, option: 'The Drunken Griffin' }, { id: 11, option: 'The Rusty Anchor' }],
  };
  const buildHandlers = () => ({
    onCancel: jasmine.createSpy('onCancel'),
    onToggleOverride: jasmine.createSpy('onToggleOverride'),
    onSelectOption: jasmine.createSpy('onSelectOption'),
    onSubmit: jasmine.createSpy('onSubmit'),
  });
  const buildState = (overrides = {}) => ({
    override: false, maxVoteOptionIds: [10], effectiveWinnerId: 10, selectedOptionId: null, status: 'idle',
    ...overrides,
  });

  describe('.render', function() {
    it('renders the modal title and the poll title in the confirm message', function() {
      const element = PollCloseModalHelper.render(true, poll, buildState(), buildHandlers());
      const title = findElement(element, (child) => child.type === Modal.Title);

      expect(title.props.children).toBe('Close Poll');
      expect(JSON.stringify(element)).toContain('Which tavern?');
    });

    it('wires the modal onHide and the cancel/submit handlers', function() {
      const handlers = buildHandlers();
      const element = PollCloseModalHelper.render(true, poll, buildState(), handlers);
      const modal = findElement(element, (child) => child.type === Modal);
      const cancelButton = findElement(
        element,
        (child) => child.type === 'button' && child.props.className === 'btn btn-secondary'
      );
      const submitButton = findElement(
        element,
        (child) => child.type === 'button' && child.props.className === 'btn btn-danger'
      );

      modal.props.onHide();
      cancelButton.props.onClick();
      submitButton.props.onClick();

      expect(handlers.onCancel).toHaveBeenCalledTimes(2);
      expect(handlers.onSubmit).toHaveBeenCalled();
    });

    it('renders the "Override Decision" switch reflecting state.override', function() {
      const handlers = buildHandlers();
      const element = PollCloseModalHelper.render(true, poll, buildState({ override: true }), handlers);
      const overrideSwitch = findElement(element, (child) => child.type === Form.Check);

      expect(overrideSwitch.props.type).toBe('switch');
      expect(overrideSwitch.props.checked).toBe(true);

      overrideSwitch.props.onChange();

      expect(handlers.onToggleOverride).toHaveBeenCalled();
    });

    it('highlights the sole max-vote option green and does not show a tie alert in the off mode', function() {
      const element = PollCloseModalHelper.render(true, poll, buildState(), buildHandlers());
      const items = findAllElements(element, (child) => child.type === 'li');
      const winnerItem = items.find((item) => item.props.className.includes('bg-success-subtle'));
      const alert = findElement(element, (child) => child.props?.className === 'alert alert-warning');

      expect(winnerItem).not.toBeUndefined();
      expect(items.some((item) => item.props.className.includes('bg-danger-subtle'))).toBe(false);
      expect(alert).toBeNull();
    });

    it('shows a tie alert and marks the non-effective tied options red in the off mode', function() {
      const tiedState = buildState({ maxVoteOptionIds: [10, 11], effectiveWinnerId: 10 });
      const element = PollCloseModalHelper.render(true, poll, tiedState, buildHandlers());
      const alert = findElement(element, (child) => child.props?.className === 'alert alert-warning');
      const items = findAllElements(element, (child) => child.type === 'li');

      expect(alert).not.toBeNull();
      expect(items.some((item) => item.props.className.includes('bg-success-subtle'))).toBe(true);
      expect(items.some((item) => item.props.className.includes('bg-danger-subtle'))).toBe(true);
    });

    it('does not render radio inputs in the default (off) mode', function() {
      const element = PollCloseModalHelper.render(true, poll, buildState(), buildHandlers());
      const radios = findAllElements(element, (child) => child.type === 'input' && child.props.type === 'radio');

      expect(radios.length).toBe(0);
    });

    it('renders a radio input per option in override mode, wired to onSelectOption', function() {
      const handlers = buildHandlers();
      const overrideState = buildState({ override: true, selectedOptionId: 11 });
      const element = PollCloseModalHelper.render(true, poll, overrideState, handlers);
      const radios = findAllElements(element, (child) => child.type === 'input' && child.props.type === 'radio');

      expect(radios.length).toBe(2);
      expect(radios.find((radio) => radio.props.id === 'poll-close-modal-option-11').props.checked).toBe(true);
      expect(radios.find((radio) => radio.props.id === 'poll-close-modal-option-10').props.checked).toBe(false);

      radios.find((radio) => radio.props.id === 'poll-close-modal-option-10').props.onChange();

      expect(handlers.onSelectOption).toHaveBeenCalledWith(10);
    });

    it('hints the max-vote option(s) green in override mode regardless of selection', function() {
      const overrideState = buildState({ override: true, selectedOptionId: 11 });
      const element = PollCloseModalHelper.render(true, poll, overrideState, buildHandlers());
      const items = findAllElements(element, (child) => child.type === 'li');
      const winnerItem = items.find((item) => item.props.className.includes('bg-success-subtle'));

      expect(winnerItem).not.toBeUndefined();
    });

    it('disables submit in override mode until an option is selected', function() {
      const overrideState = buildState({ override: true, selectedOptionId: null });
      const element = PollCloseModalHelper.render(true, poll, overrideState, buildHandlers());
      const submitButton = findElement(element, (child) => child.props?.className === 'btn btn-danger');

      expect(submitButton.props.disabled).toBe(true);
    });

    it('enables submit once an option is selected in override mode', function() {
      const overrideState = buildState({ override: true, selectedOptionId: 10 });
      const element = PollCloseModalHelper.render(true, poll, overrideState, buildHandlers());
      const submitButton = findElement(element, (child) => child.props?.className === 'btn btn-danger');

      expect(submitButton.props.disabled).toBe(false);
    });

    it('disables submit while a request is submitting', function() {
      const submittingState = buildState({ status: 'submitting' });
      const element = PollCloseModalHelper.render(true, poll, submittingState, buildHandlers());
      const submitButton = findElement(element, (child) => child.props?.className === 'btn btn-danger');

      expect(submitButton.props.disabled).toBe(true);
    });

    it('renders the error message after a failed submission', function() {
      const errorState = buildState({ status: 'error' });
      const element = PollCloseModalHelper.render(true, poll, errorState, buildHandlers());

      expect(JSON.stringify(element)).toContain('Failed to close poll');
    });

    it('does not render the error message when idle', function() {
      const element = PollCloseModalHelper.render(true, poll, buildState(), buildHandlers());

      expect(JSON.stringify(element)).not.toContain('Failed to close poll');
    });

    it('respects the show flag', function() {
      const element = PollCloseModalHelper.render(false, poll, buildState(), buildHandlers());
      const modal = findElement(element, (child) => child.type === Modal);

      expect(modal.props.show).toBe(false);
    });
  });
});
