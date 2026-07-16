import CreateSessionPollModalHelper
  from '../../../../../../../../../assets/js/components/resources/game_session/pages/elements/helpers/CreateSessionPollModalHelper.jsx';
import Modal from 'react-bootstrap/cjs/Modal.js';

// Function components (e.g. PollOptionInput) are rendered by calling them
// with their props so the search can traverse into their output; class/exotic
// components (Modal, Modal.Header, ...) are left as-is.
const isFunctionComponent = (type) => typeof type === 'function' && !type.prototype?.isReactComponent;

const childrenOf = (node) => {
  if (isFunctionComponent(node.type)) {
    return node.type(node.props);
  }

  return node.props?.children;
};

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

  return findElement(childrenOf(node), matcher);
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

  findAllElements(childrenOf(node), matcher, found);

  return found;
};

describe('CreateSessionPollModalHelper', function() {
  const buildHandlers = () => ({
    onClose: jasmine.createSpy('onClose'),
    onConfirm: jasmine.createSpy('onConfirm'),
    onDateChange: jasmine.createSpy('onDateChange'),
    onDateRemove: jasmine.createSpy('onDateRemove'),
  });

  const buildState = (overrides = {}) => ({
    dates: [''],
    canConfirm: false,
    ...overrides,
  });

  describe('.render', function() {
    it('renders a Modal with the given show flag', function() {
      const element = CreateSessionPollModalHelper.render(true, buildState(), buildHandlers());

      expect(element.type).toBe(Modal);
      expect(element.props.show).toBe(true);
    });

    it('wires onHide to the onClose handler', function() {
      const handlers = buildHandlers();
      const element = CreateSessionPollModalHelper.render(true, buildState(), handlers);

      element.props.onHide();

      expect(handlers.onClose).toHaveBeenCalled();
    });

    it('renders one date input per entry', function() {
      const element = CreateSessionPollModalHelper.render(
        true, buildState({ dates: ['2024-01-01', ''] }), buildHandlers(),
      );

      const inputs = findAllElements(
        element, (child) => child.type === 'input' && child.props.id?.startsWith('session-poll-date-'),
      );

      expect(inputs.length).toBe(2);
      expect(inputs[0].props.value).toBe('2024-01-01');
    });

    it('wires each date input change to onDateChange with its index', function() {
      const handlers = buildHandlers();
      const element = CreateSessionPollModalHelper.render(
        true, buildState({ dates: ['2024-01-01', ''] }), handlers,
      );
      const input = findElement(element, (child) => child.type === 'input' && child.props.id === 'session-poll-date-0');

      input.props.onChange({ target: { value: '2024-02-02' } });

      expect(handlers.onDateChange).toHaveBeenCalledWith(0, '2024-02-02');
    });

    it('renders a remove button for every filled date but not for the last blank one', function() {
      const element = CreateSessionPollModalHelper.render(
        true, buildState({ dates: ['2024-01-01', ''] }), buildHandlers(),
      );

      expect(findElement(element, (child) => child.props?.['data-testid'] === 'session-poll-date-remove-0'))
        .not.toBeNull();
      expect(findElement(element, (child) => child.props?.['data-testid'] === 'session-poll-date-remove-1'))
        .toBeNull();
    });

    it('wires the remove button to onDateRemove with its index', function() {
      const handlers = buildHandlers();
      const element = CreateSessionPollModalHelper.render(
        true, buildState({ dates: ['2024-01-01', ''] }), handlers,
      );
      const removeButton = findElement(
        element, (child) => child.props?.['data-testid'] === 'session-poll-date-remove-0',
      );

      removeButton.props.onClick();

      expect(handlers.onDateRemove).toHaveBeenCalledWith(0);
    });

    it('renders Cancel/Confirm buttons in the footer, wired to onClose/onConfirm', function() {
      const handlers = buildHandlers();
      const element = CreateSessionPollModalHelper.render(true, buildState(), handlers);
      const footer = findElement(element, (child) => child.type === Modal.Footer);
      const buttons = findAllElements(footer, (child) => child.type === 'button');

      const cancelButton = buttons.find((button) => button.props.onClick === handlers.onClose);
      const confirmButton = buttons.find((button) => button.props.onClick === handlers.onConfirm);

      cancelButton.props.onClick();
      confirmButton.props.onClick();

      expect(handlers.onClose).toHaveBeenCalled();
      expect(handlers.onConfirm).toHaveBeenCalled();
    });

    it('disables the Confirm button when canConfirm is false', function() {
      const element = CreateSessionPollModalHelper.render(true, buildState({ canConfirm: false }), buildHandlers());
      const footer = findElement(element, (child) => child.type === Modal.Footer);
      const confirmButton = findAllElements(footer, (child) => child.type === 'button')
        .find((button) => button.props.className.includes('btn-primary'));

      expect(confirmButton.props.disabled).toBe(true);
    });

    it('enables the Confirm button when canConfirm is true', function() {
      const element = CreateSessionPollModalHelper.render(true, buildState({ canConfirm: true }), buildHandlers());
      const footer = findElement(element, (child) => child.type === Modal.Footer);
      const confirmButton = findAllElements(footer, (child) => child.type === 'button')
        .find((button) => button.props.className.includes('btn-primary'));

      expect(confirmButton.props.disabled).toBe(false);
    });

    it('renders an error message when given', function() {
      const element = CreateSessionPollModalHelper.render(true, buildState({ error: 'Something failed' }), buildHandlers());
      const alert = findElement(element, (child) => child.props?.className === 'alert alert-danger');

      expect(alert).not.toBeNull();
      expect(alert.props.children).toBe('Something failed');
    });

    it('renders no error message when not given', function() {
      const element = CreateSessionPollModalHelper.render(true, buildState(), buildHandlers());

      expect(findElement(element, (child) => child.props?.className === 'alert alert-danger')).toBeNull();
    });
  });
});
