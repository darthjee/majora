import TaskDetailModalHelper from '../../../../../../../assets/js/components/common/modals/helpers/TaskDetailModalHelper.jsx';
import Modal from 'react-bootstrap/cjs/Modal.js';

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

describe('TaskDetailModalHelper', function() {
  const task = { id: 1, short_description: 'Prep encounter', long_description: 'Line 1\nLine 2', completed: false };

  const buildHandlers = () => ({
    onClose: jasmine.createSpy('onClose'),
    onEdit: jasmine.createSpy('onEdit'),
    onCancel: jasmine.createSpy('onCancel'),
    onSave: jasmine.createSpy('onSave'),
    onShortDescriptionChange: jasmine.createSpy('onShortDescriptionChange'),
    onLongDescriptionChange: jasmine.createSpy('onLongDescriptionChange'),
  });

  const buildState = (overrides = {}) => ({
    task, editing: false, shortDescription: task.short_description, longDescription: task.long_description, ...overrides,
  });

  describe('.render', function() {
    it('renders a Modal with the given show flag', function() {
      const element = TaskDetailModalHelper.render(true, buildState(), buildHandlers());

      expect(element.type).toBe(Modal);
      expect(element.props.show).toBe(true);
    });

    it('wires onHide to the onClose handler', function() {
      const handlers = buildHandlers();
      const element = TaskDetailModalHelper.render(true, buildState(), handlers);

      element.props.onHide();

      expect(handlers.onClose).toHaveBeenCalled();
    });

    it('renders the full long_description in view mode', function() {
      const element = TaskDetailModalHelper.render(true, buildState(), buildHandlers());
      const paragraph = findElement(element, (child) => child.type === 'p');

      expect(paragraph.props.children).toBe(task.long_description);
    });

    it('renders an Edit button in view mode', function() {
      const handlers = buildHandlers();
      const element = TaskDetailModalHelper.render(true, buildState(), handlers);
      const button = findElement(element, (child) => child.type === 'button');

      button.props.onClick();

      expect(handlers.onEdit).toHaveBeenCalled();
    });

    it('does not render editable inputs in view mode', function() {
      const element = TaskDetailModalHelper.render(true, buildState(), buildHandlers());
      const input = findElement(element, (child) => child.type === 'input');

      expect(input).toBeNull();
    });

    it('renders editable short/long description inputs in edit mode', function() {
      const element = TaskDetailModalHelper.render(true, buildState({ editing: true }), buildHandlers());
      const input = findElement(element, (child) => child.type === 'input');
      const textarea = findElement(element, (child) => child.type === 'textarea');

      expect(input.props.value).toBe(task.short_description);
      expect(textarea.props.value).toBe(task.long_description);
    });

    it('wires the short description input change to onShortDescriptionChange', function() {
      const handlers = buildHandlers();
      const element = TaskDetailModalHelper.render(true, buildState({ editing: true }), handlers);
      const input = findElement(element, (child) => child.type === 'input');

      input.props.onChange({ target: { value: 'New short description' } });

      expect(handlers.onShortDescriptionChange).toHaveBeenCalledWith('New short description');
    });

    it('wires the long description textarea change to onLongDescriptionChange', function() {
      const handlers = buildHandlers();
      const element = TaskDetailModalHelper.render(true, buildState({ editing: true }), handlers);
      const textarea = findElement(element, (child) => child.type === 'textarea');

      textarea.props.onChange({ target: { value: 'New long description' } });

      expect(handlers.onLongDescriptionChange).toHaveBeenCalledWith('New long description');
    });

    it('renders Save/Cancel buttons in edit mode', function() {
      const handlers = buildHandlers();
      const element = TaskDetailModalHelper.render(true, buildState({ editing: true }), handlers);
      const footer = findElement(element, (child) => child.type === Modal.Footer);
      const buttons = footer.props.children.props.children;

      buttons[0].props.onClick();
      buttons[1].props.onClick();

      expect(handlers.onCancel).toHaveBeenCalled();
      expect(handlers.onSave).toHaveBeenCalled();
    });
  });
});
