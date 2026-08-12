import Modal from 'react-bootstrap/cjs/Modal.js';
import FactionNewModalHelper
  from '../../../../../../../../../assets/js/components/resources/faction/pages/elements/helpers/FactionNewModalHelper.jsx';

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

const findText = (node) => {
  if (typeof node === 'string') {
    return node;
  }

  if (Array.isArray(node)) {
    return node.map(findText).join('');
  }

  if (node && typeof node === 'object') {
    return findText(childrenOf(node));
  }

  return '';
};

describe('FactionNewModalHelper', function() {
  const buildHandlers = () => ({
    onClose: jasmine.createSpy('onClose'),
    onSubmit: jasmine.createSpy('onSubmit'),
    onNameChange: jasmine.createSpy('onNameChange'),
    onOpenUploadModal: jasmine.createSpy('onOpenUploadModal'),
    onRetryPhotoUpload: jasmine.createSpy('onRetryPhotoUpload'),
    onSkipPhotoUpload: jasmine.createSpy('onSkipPhotoUpload'),
  });

  const buildState = (overrides = {}) => ({
    name: 'The Silver Hand',
    status: 'idle',
    fieldErrors: {},
    photoPreviewUrl: null,
    ...overrides,
  });

  describe('.render', function() {
    it('renders a Modal with the given show flag', function() {
      const element = FactionNewModalHelper.render(true, buildState(), buildHandlers());

      expect(element.type).toBe(Modal);
      expect(element.props.show).toBe(true);
    });

    it('wires onHide to the onClose handler', function() {
      const handlers = buildHandlers();
      const element = FactionNewModalHelper.render(true, buildState(), handlers);

      element.props.onHide();

      expect(handlers.onClose).toHaveBeenCalled();
    });

    it('renders the modal title', function() {
      const element = FactionNewModalHelper.render(true, buildState(), buildHandlers());
      const title = findElement(element, (child) => child.type === Modal.Title);

      expect(findText(title)).toBe('New Faction');
    });

    it('wires the form submit to onSubmit', function() {
      const handlers = buildHandlers();
      const element = FactionNewModalHelper.render(true, buildState(), handlers);
      const form = findElement(element, (child) => child.type === 'form');

      expect(form.props.onSubmit).toBe(handlers.onSubmit);
    });

    it('renders the name field seeded with the current name value', function() {
      const element = FactionNewModalHelper.render(true, buildState(), buildHandlers());
      const input = findElement(element, (child) => child.type === 'input' && child.props.id === 'faction-new-name');

      expect(input.props.value).toBe('The Silver Hand');
    });

    it('renders the photo field wired to onOpenUploadModal', function() {
      const handlers = buildHandlers();
      const element = FactionNewModalHelper.render(true, buildState(), handlers);
      const photoField = findElement(element, (child) => child.props?.onClick === handlers.onOpenUploadModal);

      expect(photoField).not.toBeNull();
    });

    it('renders a full-width submit button in the footer', function() {
      const element = FactionNewModalHelper.render(true, buildState(), buildHandlers());
      const footer = findElement(element, (child) => child.type === Modal.Footer);
      const button = findElement(footer, (child) => child.props?.type === 'submit');

      expect(button).not.toBeNull();
      expect(findText(button)).toBe('Create Faction');
    });

    it('disables the submit button while submitting', function() {
      const element = FactionNewModalHelper.render(true, buildState({ status: 'submitting' }), buildHandlers());
      const footer = findElement(element, (child) => child.type === Modal.Footer);
      const button = findElement(footer, (child) => child.props?.type === 'submit');

      expect(button.props.disabled).toBe(true);
    });

    it('does not disable the submit button when status is idle', function() {
      const element = FactionNewModalHelper.render(true, buildState(), buildHandlers());
      const footer = findElement(element, (child) => child.type === Modal.Footer);
      const button = findElement(footer, (child) => child.props?.type === 'submit');

      expect(button.props.disabled).toBe(false);
    });

    it('renders per-field errors when present', function() {
      const element = FactionNewModalHelper.render(
        true, buildState({ fieldErrors: { name: ['is required'] } }), buildHandlers(),
      );

      expect(findText(element)).toContain('is required');
    });

    it('renders no field error alerts when none are present', function() {
      const element = FactionNewModalHelper.render(true, buildState(), buildHandlers());
      const errorAlert = findElement(element, (child) => child.props?.className === 'alert alert-danger');

      expect(errorAlert).toBeNull();
    });

    it('renders a general error alert when status is error', function() {
      const element = FactionNewModalHelper.render(true, buildState({ status: 'error' }), buildHandlers());
      const errorAlert = findElement(element, (child) => child.props?.className === 'alert alert-danger');

      expect(findText(errorAlert)).toBe('Failed to create faction. Please try again.');
    });

    it('does not render a general error alert when status is idle', function() {
      const element = FactionNewModalHelper.render(true, buildState(), buildHandlers());
      const errorAlert = findElement(element, (child) => child.props?.className === 'alert alert-danger');

      expect(errorAlert).toBeNull();
    });

    it('renders the photo-upload-failed warning with retry/skip actions when status is photo-upload-failed', function() {
      const handlers = buildHandlers();
      const element = FactionNewModalHelper.render(true, buildState({ status: 'photo-upload-failed' }), handlers);
      const warning = findElement(element, (child) => child.props?.className === 'alert alert-warning');
      const retryButton = findElement(warning, (child) => child.props?.onClick === handlers.onRetryPhotoUpload);
      const skipButton = findElement(warning, (child) => child.props?.onClick === handlers.onSkipPhotoUpload);

      expect(warning).not.toBeNull();
      expect(retryButton).not.toBeNull();
      expect(skipButton).not.toBeNull();
    });

    it('does not render the photo-upload-failed warning when status is idle', function() {
      const element = FactionNewModalHelper.render(true, buildState(), buildHandlers());
      const warning = findElement(element, (child) => child.props?.className === 'alert alert-warning');

      expect(warning).toBeNull();
    });
  });
});
