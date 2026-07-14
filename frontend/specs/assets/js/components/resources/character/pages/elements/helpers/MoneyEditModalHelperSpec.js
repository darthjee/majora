import MoneyEditModalHelper
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/helpers/MoneyEditModalHelper.jsx';
import Modal from 'react-bootstrap/cjs/Modal.js';

// Function components (e.g. FormField) are rendered by calling them with
// their props so the search can traverse into their output; class/exotic
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

describe('MoneyEditModalHelper', function() {
  const buildHandlers = () => ({
    onClose: jasmine.createSpy('onClose'),
    onConfirm: jasmine.createSpy('onConfirm'),
    onFieldChange: jasmine.createSpy('onFieldChange'),
  });

  const buildState = (overrides = {}) => ({
    breakdown: {
      cp: 22, sp: 21, gp: 1, pp: 0, gems: 0,
    },
    canConfirm: true,
    ...overrides,
  });

  describe('.render', function() {
    it('renders a Modal with the given show flag', function() {
      const element = MoneyEditModalHelper.render(true, buildState(), buildHandlers());

      expect(element.type).toBe(Modal);
      expect(element.props.show).toBe(true);
    });

    it('wires onHide to the onClose handler', function() {
      const handlers = buildHandlers();
      const element = MoneyEditModalHelper.render(true, buildState(), handlers);

      element.props.onHide();

      expect(handlers.onClose).toHaveBeenCalled();
    });

    it('renders an input per denomination seeded with the breakdown value', function() {
      const element = MoneyEditModalHelper.render(true, buildState(), buildHandlers());

      ['cp', 'sp', 'gp', 'pp', 'gems'].forEach((key) => {
        const input = findElement(element, (child) => child.type === 'input' && child.props.id === `money-edit-${key}`);

        expect(input.props.value).toBe(buildState().breakdown[key]);
      });
    });

    it('wires each input change to onFieldChange with the denomination key', function() {
      const handlers = buildHandlers();
      const element = MoneyEditModalHelper.render(true, buildState(), handlers);
      const input = findElement(element, (child) => child.type === 'input' && child.props.id === 'money-edit-gp');

      input.props.onChange({ target: { value: '5' } });

      expect(handlers.onFieldChange).toHaveBeenCalledWith('gp', '5');
    });

    it('renders Cancel/Confirm buttons in the footer, wired to onClose/onConfirm', function() {
      const handlers = buildHandlers();
      const element = MoneyEditModalHelper.render(true, buildState(), handlers);
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
      const element = MoneyEditModalHelper.render(true, buildState({ canConfirm: false }), buildHandlers());
      const footer = findElement(element, (child) => child.type === Modal.Footer);
      const confirmButton = findAllElements(footer, (child) => child.type === 'button')
        .find((button) => button.props.className.includes('btn-primary'));

      expect(confirmButton.props.disabled).toBe(true);
    });

    it('enables the Confirm button when canConfirm is true', function() {
      const element = MoneyEditModalHelper.render(true, buildState({ canConfirm: true }), buildHandlers());
      const footer = findElement(element, (child) => child.type === Modal.Footer);
      const confirmButton = findAllElements(footer, (child) => child.type === 'button')
        .find((button) => button.props.className.includes('btn-primary'));

      expect(confirmButton.props.disabled).toBe(false);
    });

    it('renders exactly 5 denomination inputs', function() {
      const element = MoneyEditModalHelper.render(true, buildState(), buildHandlers());
      const inputs = findAllElements(element, (child) => child.type === 'input' && child.props.id?.startsWith('money-edit-'));

      expect(inputs.length).toBe(5);
    });
  });
});
