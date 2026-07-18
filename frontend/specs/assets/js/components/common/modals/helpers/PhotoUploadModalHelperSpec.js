import PhotoUploadModalHelper from '../../../../../../../assets/js/components/common/modals/helpers/PhotoUploadModalHelper.jsx';
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

describe('PhotoUploadModalHelper', function() {
  const buildHandlers = () => ({
    onClose: jasmine.createSpy('onClose'),
    onCancel: jasmine.createSpy('onCancel'),
    onSubmit: jasmine.createSpy('onSubmit'),
    onFileChange: jasmine.createSpy('onFileChange'),
    onDragOver: jasmine.createSpy('onDragOver'),
    onDrop: jasmine.createSpy('onDrop'),
  });

  const buildState = (overrides = {}) => ({
    error: false,
    uploading: false,
    ...overrides,
  });

  describe('.render', function() {
    it('renders a file input', function() {
      const element = PhotoUploadModalHelper.render(true, buildState(), buildHandlers());
      const input = findElement(
        element,
        (child) => child.type === 'input' && child.props.type === 'file'
      );

      expect(input).not.toBeNull();
    });

    it('renders cancel and submit buttons', function() {
      const element = PhotoUploadModalHelper.render(true, buildState(), buildHandlers());
      const cancelButton = findElement(
        element,
        (child) => child.type === 'button' && child.props.className === 'btn btn-secondary'
      );
      const submitButton = findElement(
        element,
        (child) => child.type === 'button' && child.props.className === 'btn btn-primary'
      );

      expect(cancelButton).not.toBeNull();
      expect(submitButton).not.toBeNull();
    });

    it('disables the submit button when uploading', function() {
      const element = PhotoUploadModalHelper.render(true, buildState({ uploading: true }), buildHandlers());
      const submitButton = findElement(
        element,
        (child) => child.type === 'button' && child.props.className === 'btn btn-primary'
      );

      expect(submitButton.props.disabled).toBe(true);
    });

    it('does not disable the submit button when not uploading', function() {
      const element = PhotoUploadModalHelper.render(true, buildState(), buildHandlers());
      const submitButton = findElement(
        element,
        (child) => child.type === 'button' && child.props.className === 'btn btn-primary'
      );

      expect(submitButton.props.disabled).toBe(false);
    });

    it('renders the error alert when state.error is true', function() {
      const element = PhotoUploadModalHelper.render(true, buildState({ error: true }), buildHandlers());
      const alert = findElement(
        element,
        (child) => child.type === 'div' && child.props.className === 'alert alert-danger'
      );

      expect(alert).not.toBeNull();
    });

    it('does not render the error alert when state.error is false', function() {
      const element = PhotoUploadModalHelper.render(true, buildState(), buildHandlers());
      const alert = findElement(
        element,
        (child) => child.type === 'div' && child.props.className === 'alert alert-danger'
      );

      expect(alert).toBeNull();
    });

    it('wires the modal close, cancel, and submit handlers', function() {
      const handlers = buildHandlers();
      const element = PhotoUploadModalHelper.render(true, buildState(), handlers);
      const modal = findElement(element, (child) => child.type === Modal);
      const cancelButton = findElement(
        element,
        (child) => child.type === 'button' && child.props.className === 'btn btn-secondary'
      );
      const submitButton = findElement(
        element,
        (child) => child.type === 'button' && child.props.className === 'btn btn-primary'
      );

      modal.props.onHide();
      cancelButton.props.onClick();
      submitButton.props.onClick();

      expect(handlers.onClose).toHaveBeenCalled();
      expect(handlers.onCancel).toHaveBeenCalled();
      expect(handlers.onSubmit).toHaveBeenCalled();
    });

    it('wires the drag-over and drop handlers on the drop zone', function() {
      const handlers = buildHandlers();
      const element = PhotoUploadModalHelper.render(true, buildState(), handlers);
      const dropZone = findElement(
        element,
        (child) => child.type === 'div' && child.props.className === 'border border-2 p-4 text-center'
      );
      const fakeEvent = { preventDefault: jasmine.createSpy('preventDefault') };

      dropZone.props.onDragOver(fakeEvent);
      dropZone.props.onDrop(fakeEvent);

      expect(handlers.onDragOver).toHaveBeenCalledWith(fakeEvent);
      expect(handlers.onDrop).toHaveBeenCalledWith(fakeEvent);
    });

    it('wires the file change handler on the input', function() {
      const handlers = buildHandlers();
      const element = PhotoUploadModalHelper.render(true, buildState(), handlers);
      const input = findElement(
        element,
        (child) => child.type === 'input' && child.props.type === 'file'
      );
      const changeEvent = { target: { files: [{}] } };

      input.props.onChange(changeEvent);

      expect(handlers.onFileChange).toHaveBeenCalledWith(changeEvent);
    });
  });
});
