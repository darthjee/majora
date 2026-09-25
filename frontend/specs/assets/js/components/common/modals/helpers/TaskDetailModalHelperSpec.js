import TaskDetailModalHelper from '../../../../../../../assets/js/components/common/modals/helpers/TaskDetailModalHelper.jsx';
import Modal from 'react-bootstrap/cjs/Modal.js';
import Badge from '../../../../../../../assets/js/components/common/badges/Badge.jsx';
import SingleResourcePickerField
  from '../../../../../../../assets/js/components/common/forms/SingleResourcePickerField.jsx';

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
  const task = { id: 1, short_description: 'Prep encounter', long_description: 'Line 1\nLine 2', completed: false, category: 'painting' };

  const buildHandlers = () => ({
    onClose: jasmine.createSpy('onClose'),
    onEdit: jasmine.createSpy('onEdit'),
    onCancel: jasmine.createSpy('onCancel'),
    onSave: jasmine.createSpy('onSave'),
    onCategoryChange: jasmine.createSpy('onCategoryChange'),
    onShortDescriptionChange: jasmine.createSpy('onShortDescriptionChange'),
    onLongDescriptionChange: jasmine.createSpy('onLongDescriptionChange'),
  });

  const buildState = (overrides = {}) => ({
    task, editing: false, category: task.category, shortDescription: task.short_description, longDescription: task.long_description, ...overrides,
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

    it('renders the translated category badge in view mode', function() {
      const element = TaskDetailModalHelper.render(true, buildState(), buildHandlers());
      const badge = findElement(element, (child) => child.type === Badge);

      expect(badge.props.text).toBe('Painting');
    });

    it('renders the other label for an unknown category in view mode', function() {
      const state = buildState({ task: { ...task, category: 'cooking' } });
      const element = TaskDetailModalHelper.render(true, state, buildHandlers());
      const badge = findElement(element, (child) => child.type === Badge);

      expect(badge.props.text).toBe('Other');
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

    it('does not render the category picker in view mode', function() {
      const element = TaskDetailModalHelper.render(true, buildState(), buildHandlers());
      const picker = findElement(element, (child) => child.type === SingleResourcePickerField);

      expect(picker).toBeNull();
    });

    it('renders the category picker as the first edit field, showing the current category', function() {
      const element = TaskDetailModalHelper.render(true, buildState({ editing: true }), buildHandlers());
      const body = findElement(element, (child) => child.type === Modal.Body);
      const [first] = body.props.children.props.children.filter(Boolean);

      expect(first.type).toBe(SingleResourcePickerField);
      expect(first.props.id).toBe('task-detail-category');
      expect(first.props.value).toEqual({ id: 'painting', name: 'Painting' });
      expect(first.props.picker.values[9]).toBe('other');
      expect(first.props.picker.maxEntries).toBe(10);
      expect(first.props.picker.maxEntries).toBe(first.props.picker.values.length);
      expect(first.props.label).toBe('Category');
      expect(first.props.searchPlaceholder).toBe('Search category...');
    });

    it('wires the category picker change to onCategoryChange', function() {
      const handlers = buildHandlers();
      const element = TaskDetailModalHelper.render(true, buildState({ editing: true, category: 'buying' }), handlers);
      const picker = findElement(element, (child) => child.type === SingleResourcePickerField);

      picker.props.onChange({ id: 'writing', name: 'Writing' });

      expect(picker.props.value).toEqual({ id: 'buying', name: 'Buying' });
      expect(handlers.onCategoryChange).toHaveBeenCalledWith({ id: 'writing', name: 'Writing' });
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

    it('does not render an error alert when there is no error', function() {
      const element = TaskDetailModalHelper.render(true, buildState({ editing: true, error: '' }), buildHandlers());
      const alert = findElement(element, (child) => child.props?.className === 'alert alert-danger');

      expect(alert).toBeNull();
    });

    it('renders the error alert above the fields when there is an error', function() {
      const element = TaskDetailModalHelper.render(true, buildState({ editing: true, error: 'Unable to save task.' }), buildHandlers());
      const body = findElement(element, (child) => child.type === Modal.Body);
      const [first] = body.props.children.props.children;

      expect(first.props.className).toBe('alert alert-danger');
      expect(first.props.children).toBe('Unable to save task.');
    });

    it('renders enabled Save/Cancel buttons with the Save label when not saving', function() {
      const element = TaskDetailModalHelper.render(true, buildState({ editing: true, saving: false }), buildHandlers());
      const footer = findElement(element, (child) => child.type === Modal.Footer);
      const [cancel, save] = footer.props.children.props.children;

      expect(cancel.props.disabled).toBe(false);
      expect(save.props.disabled).toBe(false);
      expect(save.props.children).toBe('Save');
    });

    it('disables Save/Cancel and shows the saving label while saving', function() {
      const element = TaskDetailModalHelper.render(true, buildState({ editing: true, saving: true }), buildHandlers());
      const footer = findElement(element, (child) => child.type === Modal.Footer);
      const [cancel, save] = footer.props.children.props.children;

      expect(cancel.props.disabled).toBe(true);
      expect(save.props.disabled).toBe(true);
      expect(save.props.children).toBe('Saving…');
    });
  });
});
