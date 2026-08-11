import Modal from 'react-bootstrap/cjs/Modal.js';
import StlModelNewModalHelper
  from '../../../../../../../../../assets/js/components/resources/stl_model/pages/elements/helpers/StlModelNewModalHelper.jsx';
import MultiResourcePickerField
  from '../../../../../../../../../assets/js/components/common/forms/MultiResourcePickerField.jsx';
import ResourcePickerSearch
  from '../../../../../../../../../assets/js/components/common/forms/ResourcePickerSearch.jsx';
import RemovableBadge from '../../../../../../../../../assets/js/components/common/badges/RemovableBadge.jsx';

// Function components (e.g. FormField) are rendered by calling them with their props so the
// search can traverse into their output; class/exotic components (Modal, Modal.Header, ...) and
// stateful components (e.g. `ResourcePickerSearch`, reached through `MultiResourcePickerField`,
// which owns hooks and cannot be invoked directly outside of a real React render) are left as
// opaque leaves instead.
const STATEFUL_COMPONENTS = [ResourcePickerSearch];
const isFunctionComponent = (type) => (
  typeof type === 'function' && !type.prototype?.isReactComponent && !STATEFUL_COMPONENTS.includes(type)
);

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

describe('StlModelNewModalHelper', function() {
  const buildHandlers = () => ({
    onClose: jasmine.createSpy('onClose'),
    onSubmit: jasmine.createSpy('onSubmit'),
    onNameChange: jasmine.createSpy('onNameChange'),
    onTagInputChange: jasmine.createSpy('onTagInputChange'),
    onAddTag: jasmine.createSpy('onAddTag'),
    onRemoveTag: jasmine.createSpy('onRemoveTag'),
    onSourcesChange: jasmine.createSpy('onSourcesChange'),
    onCollectionsChange: jasmine.createSpy('onCollectionsChange'),
    onOpenUploadModal: jasmine.createSpy('onOpenUploadModal'),
    onRetryPhotoUpload: jasmine.createSpy('onRetryPhotoUpload'),
    onSkipPhotoUpload: jasmine.createSpy('onSkipPhotoUpload'),
  });

  const buildState = (overrides = {}) => ({
    name: 'Goblin Miniature',
    tags: ['goblin'],
    tagInput: '',
    sources: [],
    collections: [],
    status: 'idle',
    fieldErrors: {},
    photoPreviewUrl: null,
    ...overrides,
  });

  describe('.render', function() {
    it('renders a Modal with the given show flag', function() {
      const element = StlModelNewModalHelper.render(true, buildState(), buildHandlers());

      expect(element.type).toBe(Modal);
      expect(element.props.show).toBe(true);
    });

    it('wires onHide to the onClose handler', function() {
      const handlers = buildHandlers();
      const element = StlModelNewModalHelper.render(true, buildState(), handlers);

      element.props.onHide();

      expect(handlers.onClose).toHaveBeenCalled();
    });

    it('renders the modal title', function() {
      const element = StlModelNewModalHelper.render(true, buildState(), buildHandlers());
      const title = findElement(element, (child) => child.type === Modal.Title);

      expect(findText(title)).toBe('New STL Model');
    });

    it('wires the form submit to onSubmit', function() {
      const handlers = buildHandlers();
      const element = StlModelNewModalHelper.render(true, buildState(), handlers);
      const form = findElement(element, (child) => child.type === 'form');

      expect(form.props.onSubmit).toBe(handlers.onSubmit);
    });

    it('renders the name field seeded with the current name value', function() {
      const element = StlModelNewModalHelper.render(true, buildState(), buildHandlers());
      const input = findElement(element, (child) => child.type === 'input' && child.props.id === 'stl-model-new-name');

      expect(input.props.value).toBe('Goblin Miniature');
    });

    it('renders the tags field with the pending tags', function() {
      const element = StlModelNewModalHelper.render(true, buildState(), buildHandlers());
      const tagsInput = findElement(element, (child) => child.type === 'input' && child.props.id === 'stl-model-new-tags');

      expect(tagsInput).not.toBeNull();
      expect(findText(element)).toContain('goblin');
    });

    it('calls onRemoveTag with the tag when its badge remove button is clicked', function() {
      const handlers = buildHandlers();
      const element = StlModelNewModalHelper.render(true, buildState({ tags: ['goblin'] }), handlers);
      const badge = findElement(element, (child) => child.type === RemovableBadge && child.props.text === 'goblin');

      badge.props.onRemove();

      expect(handlers.onRemoveTag).toHaveBeenCalledWith('goblin');
    });

    it('renders the sources picker wired to onSourcesChange with the current sources value', function() {
      const handlers = buildHandlers();
      const sources = [{ id: 1, name: 'Wyrmwood' }];
      const element = StlModelNewModalHelper.render(true, buildState({ sources }), handlers);
      const pickers = [];
      findElement(element, (child) => {
        if (child.type === MultiResourcePickerField) pickers.push(child);
        return false;
      });
      const sourcesPicker = pickers.find((picker) => picker.props.resource === 'source');

      expect(sourcesPicker).not.toBeUndefined();
      expect(sourcesPicker.props.maxEntries).toBe(4);
      expect(sourcesPicker.props.value).toBe(sources);
      expect(sourcesPicker.props.onChange).toBe(handlers.onSourcesChange);
    });

    it('renders the collections picker wired to onCollectionsChange with the current collections value', function() {
      const handlers = buildHandlers();
      const collections = [{ id: 2, name: 'Dungeon Pack' }];
      const element = StlModelNewModalHelper.render(true, buildState({ collections }), handlers);
      const pickers = [];
      findElement(element, (child) => {
        if (child.type === MultiResourcePickerField) pickers.push(child);
        return false;
      });
      const collectionsPicker = pickers.find((picker) => picker.props.resource === 'collection');

      expect(collectionsPicker).not.toBeUndefined();
      expect(collectionsPicker.props.maxEntries).toBe(4);
      expect(collectionsPicker.props.value).toBe(collections);
      expect(collectionsPicker.props.onChange).toBe(handlers.onCollectionsChange);
    });

    it('renders the photo field wired to onOpenUploadModal', function() {
      const handlers = buildHandlers();
      const element = StlModelNewModalHelper.render(true, buildState(), handlers);
      const photoField = findElement(element, (child) => child.props?.onClick === handlers.onOpenUploadModal);

      expect(photoField).not.toBeNull();
    });

    it('renders a full-width submit button in the footer', function() {
      const element = StlModelNewModalHelper.render(true, buildState(), buildHandlers());
      const footer = findElement(element, (child) => child.type === Modal.Footer);
      const button = findElement(footer, (child) => child.props?.type === 'submit');

      expect(button).not.toBeNull();
      expect(findText(button)).toBe('Create STL Model');
    });

    it('disables the submit button while submitting', function() {
      const element = StlModelNewModalHelper.render(true, buildState({ status: 'submitting' }), buildHandlers());
      const footer = findElement(element, (child) => child.type === Modal.Footer);
      const button = findElement(footer, (child) => child.props?.type === 'submit');

      expect(button.props.disabled).toBe(true);
    });

    it('does not disable the submit button when status is idle', function() {
      const element = StlModelNewModalHelper.render(true, buildState(), buildHandlers());
      const footer = findElement(element, (child) => child.type === Modal.Footer);
      const button = findElement(footer, (child) => child.props?.type === 'submit');

      expect(button.props.disabled).toBe(false);
    });

    it('renders per-field errors when present', function() {
      const element = StlModelNewModalHelper.render(
        true, buildState({ fieldErrors: { name: ['is required'] } }), buildHandlers(),
      );

      expect(findText(element)).toContain('is required');
    });

    it('renders no field error alerts when none are present', function() {
      const element = StlModelNewModalHelper.render(true, buildState(), buildHandlers());
      const errorAlert = findElement(element, (child) => child.props?.className === 'alert alert-danger');

      expect(errorAlert).toBeNull();
    });

    it('renders a general error alert when status is error', function() {
      const element = StlModelNewModalHelper.render(true, buildState({ status: 'error' }), buildHandlers());
      const errorAlert = findElement(element, (child) => child.props?.className === 'alert alert-danger');

      expect(findText(errorAlert)).toBe('Failed to create STL model. Please try again.');
    });

    it('does not render a general error alert when status is idle', function() {
      const element = StlModelNewModalHelper.render(true, buildState(), buildHandlers());
      const errorAlert = findElement(element, (child) => child.props?.className === 'alert alert-danger');

      expect(errorAlert).toBeNull();
    });

    it('renders the photo-upload-failed warning with retry/skip actions when status is photo-upload-failed', function() {
      const handlers = buildHandlers();
      const element = StlModelNewModalHelper.render(true, buildState({ status: 'photo-upload-failed' }), handlers);
      const warning = findElement(element, (child) => child.props?.className === 'alert alert-warning');
      const retryButton = findElement(warning, (child) => child.props?.onClick === handlers.onRetryPhotoUpload);
      const skipButton = findElement(warning, (child) => child.props?.onClick === handlers.onSkipPhotoUpload);

      expect(warning).not.toBeNull();
      expect(retryButton).not.toBeNull();
      expect(skipButton).not.toBeNull();
    });

    it('does not render the photo-upload-failed warning when status is idle', function() {
      const element = StlModelNewModalHelper.render(true, buildState(), buildHandlers());
      const warning = findElement(element, (child) => child.props?.className === 'alert alert-warning');

      expect(warning).toBeNull();
    });
  });
});
