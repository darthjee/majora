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
    onNameChange: jasmine.createSpy('onNameChange'),
    onDragOver: jasmine.createSpy('onDragOver'),
    onDrop: jasmine.createSpy('onDrop'),
  });

  const buildState = (overrides = {}) => ({
    error: false,
    uploading: false,
    deferred: false,
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

    it('labels the submit button "Confirm" in deferred mode', function() {
      const element = PhotoUploadModalHelper.render(true, buildState({ deferred: true }), buildHandlers());
      const submitButton = findElement(
        element,
        (child) => child.type === 'button' && child.props.className === 'btn btn-primary'
      );

      expect(submitButton.props.children).toBe('Confirm');
    });

    it('labels the submit button "Upload" when not deferred', function() {
      const element = PhotoUploadModalHelper.render(true, buildState(), buildHandlers());
      const submitButton = findElement(
        element,
        (child) => child.type === 'button' && child.props.className === 'btn btn-primary'
      );

      expect(submitButton.props.children).toBe('Upload');
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

    describe('translationPrefix (issue #726)', function() {
      it('uses "photo_upload_modal" strings by default', function() {
        const element = PhotoUploadModalHelper.render(true, buildState({ error: true }), buildHandlers());
        const alert = findElement(
          element,
          (child) => child.type === 'div' && child.props.className === 'alert alert-danger'
        );

        expect(alert.props.children).toBe('Failed to upload photo. Please try again.');
      });

      it('uses the given translationPrefix for the submit/cancel/error strings', function() {
        const element = PhotoUploadModalHelper.render(
          true, buildState({ error: true, translationPrefix: 'file_upload_modal' }), buildHandlers(),
        );
        const submitButton = findElement(
          element,
          (child) => child.type === 'button' && child.props.className === 'btn btn-primary'
        );
        const cancelButton = findElement(
          element,
          (child) => child.type === 'button' && child.props.className === 'btn btn-secondary'
        );
        const alert = findElement(
          element,
          (child) => child.type === 'div' && child.props.className === 'alert alert-danger'
        );

        expect(submitButton.props.children).toBe('Upload');
        expect(cancelButton.props.children).toBe('Cancel');
        expect(alert.props.children).toBe('Failed to upload file. Please try again.');
      });
    });

    describe('accept (issue #726)', function() {
      it('leaves the file input unrestricted by default', function() {
        const element = PhotoUploadModalHelper.render(true, buildState(), buildHandlers());
        const input = findElement(
          element,
          (child) => child.type === 'input' && child.props.type === 'file'
        );

        expect(input.props.accept).toBeUndefined();
      });

      it('forwards the given accept value to the file input', function() {
        const element = PhotoUploadModalHelper.render(true, buildState({ accept: '.pdf' }), buildHandlers());
        const input = findElement(
          element,
          (child) => child.type === 'input' && child.props.type === 'file'
        );

        expect(input.props.accept).toBe('.pdf');
      });
    });

    describe('showNameField (issue #874)', function() {
      const findNameInput = (element) => findElement(
        element,
        (child) => child.type === 'input' && child.props.type === 'text'
      );

      it('does not render the name input when showNameField is false', function() {
        const element = PhotoUploadModalHelper.render(true, buildState(), buildHandlers());

        expect(findNameInput(element)).toBeNull();
      });

      it('renders the name input when showNameField is true', function() {
        const element = PhotoUploadModalHelper.render(
          true, buildState({ showNameField: true, name: '' }), buildHandlers(),
        );

        expect(findNameInput(element)).not.toBeNull();
      });

      it('binds the current name value to the input', function() {
        const element = PhotoUploadModalHelper.render(
          true,
          buildState({ showNameField: true, name: 'Ancient Scroll', translationPrefix: 'file_upload_modal' }),
          buildHandlers(),
        );

        expect(findNameInput(element).props.value).toBe('Ancient Scroll');
      });

      it('wires the name change handler on the input', function() {
        const handlers = buildHandlers();
        const element = PhotoUploadModalHelper.render(
          true, buildState({ showNameField: true, name: '' }), handlers,
        );
        const changeEvent = { target: { value: 'Ancient Scroll' } };

        findNameInput(element).props.onChange(changeEvent);

        expect(handlers.onNameChange).toHaveBeenCalledWith(changeEvent);
      });

      it('uses the name_label translation as the input placeholder', function() {
        const element = PhotoUploadModalHelper.render(
          true,
          buildState({ showNameField: true, name: '', translationPrefix: 'file_upload_modal' }),
          buildHandlers(),
        );

        expect(findNameInput(element).props.placeholder).toBe('Name');
      });
    });
  });
});
