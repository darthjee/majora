import { renderToStaticMarkup } from 'react-dom/server';
import StlModelNewHelper
  from '../../../../../../../../assets/js/components/resources/stl_model/pages/helpers/StlModelNewHelper.jsx';
import MultiResourcePickerField
  from '../../../../../../../../assets/js/components/common/forms/MultiResourcePickerField.jsx';

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

describe('StlModelNewHelper', function() {
  const buildHandlers = () => ({
    onSubmit: jasmine.createSpy('onSubmit'),
    onNameChange: jasmine.createSpy('onNameChange'),
    onOwnedChange: jasmine.createSpy('onOwnedChange'),
    onTypeChange: jasmine.createSpy('onTypeChange'),
    onRacesChange: jasmine.createSpy('onRacesChange'),
    onRolesChange: jasmine.createSpy('onRolesChange'),
    onUrlChange: jasmine.createSpy('onUrlChange'),
    onSizeChange: jasmine.createSpy('onSizeChange'),
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
    owned: true,
    type: 'terrain',
    races: [],
    roles: [],
    url: '',
    size: '',
    sources: [],
    collections: [],
    status: 'idle',
    fieldErrors: {},
    photoPreviewUrl: null,
    ...overrides,
  });

  describe('.render', function() {
    it('renders a back button to the STL models index', function() {
      const html = renderToStaticMarkup(StlModelNewHelper.render(buildState(), buildHandlers()));
      expect(html).toContain('href="#/miniatures/stl_models"');
    });

    it('renders the page title', function() {
      const html = renderToStaticMarkup(StlModelNewHelper.render(buildState(), buildHandlers()));
      expect(html).toContain('New STL Model');
    });

    it('wires the form submit to onSubmit', function() {
      const handlers = buildHandlers();
      const element = StlModelNewHelper.render(buildState(), handlers);
      const form = findElement(element, (child) => child.type === 'form');

      expect(form.props.onSubmit).toBe(handlers.onSubmit);
    });

    it('renders the name field seeded with the current name value', function() {
      const html = renderToStaticMarkup(StlModelNewHelper.render(buildState(), buildHandlers()));
      expect(html).toContain('id="stl-model-new-name"');
      expect(html).toContain('value="Goblin Miniature"');
    });

    it('renders the owned switch wired to onOwnedChange', function() {
      const handlers = buildHandlers();
      const element = StlModelNewHelper.render(buildState(), handlers);
      const input = findElement(element, (child) => child.props?.id === 'stl-model-new-owned');

      expect(input).not.toBeNull();
      expect(input.props.onChange).toBe(handlers.onOwnedChange);
      expect(input.props.checked).toBe(true);
    });

    it('renders the type/url/size fields', function() {
      const html = renderToStaticMarkup(StlModelNewHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('id="stl-model-new-type"');
      expect(html).toContain('id="stl-model-new-url"');
      expect(html).toContain('id="stl-model-new-size"');
    });

    it('renders a blank/None option for size, but not for type', function() {
      const html = renderToStaticMarkup(StlModelNewHelper.render(buildState(), buildHandlers()));

      expect((html.match(/<option value=""/g) ?? []).length).toBe(1);
    });

    it('wires the type/url/size fields to their change handlers', function() {
      const handlers = buildHandlers();
      const element = StlModelNewHelper.render(buildState(), handlers);
      const typeSelect = findElement(element, (child) => child.props?.id === 'stl-model-new-type');
      const urlField = findElement(element, (child) => child.props?.id === 'stl-model-new-url');
      const sizeSelect = findElement(element, (child) => child.props?.id === 'stl-model-new-size');

      expect(typeSelect.props.onChange).toBe(handlers.onTypeChange);
      expect(urlField.props.onChange).toBe(handlers.onUrlChange);
      expect(sizeSelect.props.onChange).toBe(handlers.onSizeChange);
    });

    it('renders the races picker wired to onRacesChange with the current races value', function() {
      const handlers = buildHandlers();
      const races = [{ id: 'elf', name: 'Elf' }];
      const element = StlModelNewHelper.render(buildState({ races }), handlers);
      const pickers = [];
      findElement(element, (child) => {
        if (child.type === MultiResourcePickerField) pickers.push(child);
        return false;
      });
      const racesPicker = pickers.find(
        (picker) => Array.isArray(picker.props.picker.values) && picker.props.value === races,
      );

      expect(racesPicker).not.toBeUndefined();
      expect(racesPicker.props.onChange).toBe(handlers.onRacesChange);
    });

    it('renders the roles picker wired to onRolesChange with the current roles value', function() {
      const handlers = buildHandlers();
      const roles = [{ id: 'wizard', name: 'Wizard' }];
      const element = StlModelNewHelper.render(buildState({ roles }), handlers);
      const pickers = [];
      findElement(element, (child) => {
        if (child.type === MultiResourcePickerField) pickers.push(child);
        return false;
      });
      const rolesPicker = pickers.find(
        (picker) => Array.isArray(picker.props.picker.values) && picker.props.value === roles,
      );

      expect(rolesPicker).not.toBeUndefined();
      expect(rolesPicker.props.onChange).toBe(handlers.onRolesChange);
    });

    it('renders the tags field with the pending tags', function() {
      const html = renderToStaticMarkup(StlModelNewHelper.render(buildState(), buildHandlers()));
      expect(html).toContain('id="stl-model-new-tags"');
      expect(html).toContain('goblin');
    });

    it('renders the sources picker wired to onSourcesChange with the current sources value', function() {
      const handlers = buildHandlers();
      const sources = [{ id: 1, name: 'Wyrmwood' }];
      const element = StlModelNewHelper.render(buildState({ sources }), handlers);
      const pickers = [];
      findElement(element, (child) => {
        if (child.type === MultiResourcePickerField) pickers.push(child);
        return false;
      });
      const sourcesPicker = pickers.find((picker) => picker.props.picker.resource === 'source');

      expect(sourcesPicker).not.toBeUndefined();
      expect(sourcesPicker.props.value).toBe(sources);
      expect(sourcesPicker.props.onChange).toBe(handlers.onSourcesChange);
    });

    it('renders the collections picker wired to onCollectionsChange with the current collections value', function() {
      const handlers = buildHandlers();
      const collections = [{ id: 2, name: 'Dungeon Pack' }];
      const element = StlModelNewHelper.render(buildState({ collections }), handlers);
      const pickers = [];
      findElement(element, (child) => {
        if (child.type === MultiResourcePickerField) pickers.push(child);
        return false;
      });
      const collectionsPicker = pickers.find((picker) => picker.props.picker.resource === 'collection');

      expect(collectionsPicker).not.toBeUndefined();
      expect(collectionsPicker.props.value).toBe(collections);
      expect(collectionsPicker.props.onChange).toBe(handlers.onCollectionsChange);
    });

    it('renders the photo field wired to onOpenUploadModal', function() {
      const handlers = buildHandlers();
      const element = StlModelNewHelper.render(buildState(), handlers);
      const photoField = findElement(element, (child) => child.props?.onClick === handlers.onOpenUploadModal);

      expect(photoField).not.toBeNull();
    });

    it('renders the submit button', function() {
      const html = renderToStaticMarkup(StlModelNewHelper.render(buildState(), buildHandlers()));
      expect(html).toContain('type="submit"');
      expect(html).toContain('Create STL Model');
    });

    it('disables the submit button while submitting', function() {
      const html = renderToStaticMarkup(
        StlModelNewHelper.render(buildState({ status: 'submitting' }), buildHandlers()),
      );
      expect(html).toContain('disabled=""');
    });

    it('does not disable the submit button when status is idle', function() {
      const html = renderToStaticMarkup(StlModelNewHelper.render(buildState(), buildHandlers()));
      expect(html).not.toContain('disabled=""');
    });

    it('renders per-field errors when present', function() {
      const html = renderToStaticMarkup(
        StlModelNewHelper.render(buildState({ fieldErrors: { name: ['is required'] } }), buildHandlers()),
      );
      expect(html).toContain('is required');
    });

    it('renders a general error alert when status is error', function() {
      const html = renderToStaticMarkup(
        StlModelNewHelper.render(buildState({ status: 'error' }), buildHandlers()),
      );
      expect(html).toContain('Failed to create STL model. Please try again.');
    });

    it('does not render a general error alert when status is idle', function() {
      const html = renderToStaticMarkup(StlModelNewHelper.render(buildState(), buildHandlers()));
      expect(html).not.toContain('Failed to create STL model.');
    });

    it('renders the photo-upload-failed warning with retry/skip actions when status is photo-upload-failed',
      function() {
        const handlers = buildHandlers();
        const element = StlModelNewHelper.render(buildState({ status: 'photo-upload-failed' }), handlers);
        const warning = findElement(element, (child) => child.props?.className === 'alert alert-warning');
        const retryButton = findElement(warning, (child) => child.props?.onClick === handlers.onRetryPhotoUpload);
        const skipButton = findElement(warning, (child) => child.props?.onClick === handlers.onSkipPhotoUpload);

        expect(warning).not.toBeNull();
        expect(retryButton).not.toBeNull();
        expect(skipButton).not.toBeNull();
      });

    it('does not render the photo-upload-failed warning when status is idle', function() {
      const html = renderToStaticMarkup(StlModelNewHelper.render(buildState(), buildHandlers()));
      expect(html).not.toContain('alert-warning');
    });
  });

  describe('.renderLoading', function() {
    it('renders a loading message', function() {
      expect(renderToStaticMarkup(StlModelNewHelper.renderLoading())).toContain('Loading STL model');
    });
  });
});
