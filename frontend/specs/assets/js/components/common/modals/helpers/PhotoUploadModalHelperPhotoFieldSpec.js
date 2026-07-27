import PhotoUploadModalHelper from '../../../../../../../assets/js/components/common/modals/helpers/PhotoUploadModalHelper.jsx';

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

/**
 * Split out of `PhotoUploadModalHelperSpec.js` (issue #878) to keep that file under the 300-line
 * limit — mirrors `resourceConfigMutationsSpec.js` being split out of `resourceConfigSpec.js` for
 * the same reason (issue #841).
 */
describe('PhotoUploadModalHelper showPhotoField/photo_error (issue #878)', function() {
  const buildHandlers = () => ({
    onClose: jasmine.createSpy('onClose'),
    onCancel: jasmine.createSpy('onCancel'),
    onSubmit: jasmine.createSpy('onSubmit'),
    onFileChange: jasmine.createSpy('onFileChange'),
    onNameChange: jasmine.createSpy('onNameChange'),
    onPhotoFileChange: jasmine.createSpy('onPhotoFileChange'),
    onDragOver: jasmine.createSpy('onDragOver'),
    onDrop: jasmine.createSpy('onDrop'),
  });

  const buildState = (overrides = {}) => ({
    error: false,
    uploading: false,
    deferred: false,
    ...overrides,
  });

  describe('showPhotoField', function() {
    const findPhotoInput = (element) => findElement(
      element,
      (child) => child.type === 'input' && child.props.type === 'file' && child.props.accept === 'image/*'
    );

    it('does not render the photo input when showPhotoField is false', function() {
      const element = PhotoUploadModalHelper.render(true, buildState(), buildHandlers());

      expect(findPhotoInput(element)).toBeNull();
    });

    it('renders the photo input when showPhotoField is true', function() {
      const element = PhotoUploadModalHelper.render(
        true, buildState({ showPhotoField: true }), buildHandlers(),
      );

      expect(findPhotoInput(element)).not.toBeNull();
    });

    it('restricts the photo input to images', function() {
      const element = PhotoUploadModalHelper.render(
        true, buildState({ showPhotoField: true }), buildHandlers(),
      );

      expect(findPhotoInput(element).props.accept).toBe('image/*');
    });

    it('wires the photo file change handler on the input', function() {
      const handlers = buildHandlers();
      const element = PhotoUploadModalHelper.render(
        true, buildState({ showPhotoField: true }), handlers,
      );
      const changeEvent = { target: { files: [{}] } };

      findPhotoInput(element).props.onChange(changeEvent);

      expect(handlers.onPhotoFileChange).toHaveBeenCalledWith(changeEvent);
    });

    it('uses the photo_label translation as the aria-label', function() {
      const element = PhotoUploadModalHelper.render(
        true,
        buildState({ showPhotoField: true, translationPrefix: 'file_upload_modal' }),
        buildHandlers(),
      );

      expect(findPhotoInput(element).props['aria-label']).toBe('Photo (optional)');
    });
  });

  describe('photo_error', function() {
    it('renders the photo_error translation when state.error is "photo"', function() {
      const element = PhotoUploadModalHelper.render(
        true,
        buildState({ error: 'photo', translationPrefix: 'file_upload_modal' }),
        buildHandlers(),
      );
      const alert = findElement(
        element,
        (child) => child.type === 'div' && child.props.className === 'alert alert-danger'
      );

      expect(alert.props.children).toBe('Failed to upload photo. Please try again.');
    });

    it('renders the plain error translation when state.error is true', function() {
      const element = PhotoUploadModalHelper.render(
        true,
        buildState({ error: true, translationPrefix: 'file_upload_modal' }),
        buildHandlers(),
      );
      const alert = findElement(
        element,
        (child) => child.type === 'div' && child.props.className === 'alert alert-danger'
      );

      expect(alert.props.children).toBe('Failed to upload file. Please try again.');
    });
  });
});
