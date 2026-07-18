import ViewAsModalHelper from '../../../../../../../assets/js/components/common/modals/helpers/ViewAsModalHelper.jsx';
import Modal from 'react-bootstrap/cjs/Modal.js';
import Form from 'react-bootstrap/cjs/Form.js';
import Collapse from 'react-bootstrap/cjs/Collapse.js';

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

describe('ViewAsModalHelper', function() {
  const buildHandlers = () => ({
    onCancel: jasmine.createSpy('onCancel'),
    onSave: jasmine.createSpy('onSave'),
    onToggleEnabled: jasmine.createSpy('onToggleEnabled'),
    onToggleRole: jasmine.createSpy('onToggleRole'),
  });

  const buildState = (overrides = {}) => ({
    enabled: false,
    roles: [],
    ...overrides,
  });

  describe('.render', function() {
    it('wires the modal close/cancel/save handlers', function() {
      const handlers = buildHandlers();
      const element = ViewAsModalHelper.render(true, buildState(), handlers);
      const modal = findElement(element, (child) => child.type === Modal);
      const cancelButton = findElement(
        element,
        (child) => child.type === 'button' && child.props.className === 'btn btn-secondary'
      );
      const saveButton = findElement(
        element,
        (child) => child.type === 'button' && child.props.className === 'btn btn-primary'
      );

      modal.props.onHide();
      cancelButton.props.onClick();
      saveButton.props.onClick();

      expect(handlers.onCancel).toHaveBeenCalled();
      expect(handlers.onSave).toHaveBeenCalled();
    });

    it('renders the enabled switch reflecting state.enabled, wired to onToggleEnabled', function() {
      const handlers = buildHandlers();
      const element = ViewAsModalHelper.render(true, buildState({ enabled: true }), handlers);
      const enabledSwitch = findElement(
        element,
        (child) => child.type === Form.Check && child.props.id === 'view-as-modal-enabled'
      );

      expect(enabledSwitch.props.type).toBe('switch');
      expect(enabledSwitch.props.checked).toBe(true);

      enabledSwitch.props.onChange();

      expect(handlers.onToggleEnabled).toHaveBeenCalled();
    });

    it('wraps the role checkboxes in a Collapse reflecting state.enabled', function() {
      const handlers = buildHandlers();
      const enabledElement = ViewAsModalHelper.render(true, buildState({ enabled: true }), handlers);
      const disabledElement = ViewAsModalHelper.render(true, buildState({ enabled: false }), handlers);

      const enabledCollapse = findElement(enabledElement, (child) => child.type === Collapse);
      const disabledCollapse = findElement(disabledElement, (child) => child.type === Collapse);

      expect(enabledCollapse.props.in).toBe(true);
      expect(disabledCollapse.props.in).toBe(false);
    });

    it('renders one checkbox per simulatable role, reflecting state.roles', function() {
      const handlers = buildHandlers();
      const element = ViewAsModalHelper.render(true, buildState({ roles: ['dm'] }), handlers);
      const checkboxes = findAllElements(
        element,
        (child) => child.type === 'input' && child.props.id?.startsWith('view-as-modal-role-')
      );

      expect(checkboxes.length).toBe(3);

      const dmCheckbox = checkboxes.find((checkbox) => checkbox.props.id === 'view-as-modal-role-dm');
      const playerCheckbox = checkboxes.find((checkbox) => checkbox.props.id === 'view-as-modal-role-player');

      expect(dmCheckbox.props.checked).toBe(true);
      expect(playerCheckbox.props.checked).toBe(false);

      dmCheckbox.props.onChange();

      expect(handlers.onToggleRole).toHaveBeenCalledWith('dm');
    });
  });
});
