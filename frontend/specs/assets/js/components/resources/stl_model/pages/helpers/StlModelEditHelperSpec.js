import { renderToStaticMarkup } from 'react-dom/server';
import StlModelEditHelper
  from '../../../../../../../../assets/js/components/resources/stl_model/pages/helpers/StlModelEditHelper.jsx';
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

describe('StlModelEditHelper', function() {
  const buildHandlers = () => ({
    onSubmit: jasmine.createSpy('onSubmit'),
    onNameChange: jasmine.createSpy('onNameChange'),
    onOwnedChange: jasmine.createSpy('onOwnedChange'),
    onTypeChange: jasmine.createSpy('onTypeChange'),
    onRacesChange: jasmine.createSpy('onRacesChange'),
    onRolesChange: jasmine.createSpy('onRolesChange'),
    onUrlChange: jasmine.createSpy('onUrlChange'),
    onSizeChange: jasmine.createSpy('onSizeChange'),
  });

  const buildState = (overrides = {}) => ({
    name: 'Goblin Miniature',
    owned: true,
    type: 'creature',
    races: [],
    roles: [],
    url: '',
    size: '',
    status: 'idle',
    fieldErrors: {},
    ...overrides,
  });

  describe('.render', function() {
    it('renders a back button to the STL models index', function() {
      const html = renderToStaticMarkup(StlModelEditHelper.render(buildState(), buildHandlers()));
      expect(html).toContain('href="#/miniatures/stl_models"');
    });

    it('renders the page title', function() {
      const html = renderToStaticMarkup(StlModelEditHelper.render(buildState(), buildHandlers()));
      expect(html).toContain('Edit STL Model');
    });

    it('wires the form submit to onSubmit', function() {
      const handlers = buildHandlers();
      const element = StlModelEditHelper.render(buildState(), handlers);
      const form = findElement(element, (child) => child.type === 'form');

      expect(form.props.onSubmit).toBe(handlers.onSubmit);
    });

    it('renders the name field seeded with the current name value', function() {
      const html = renderToStaticMarkup(StlModelEditHelper.render(buildState(), buildHandlers()));
      expect(html).toContain('id="stl-model-edit-name"');
      expect(html).toContain('value="Goblin Miniature"');
    });

    it('renders the owned switch wired to onOwnedChange', function() {
      const handlers = buildHandlers();
      const element = StlModelEditHelper.render(buildState({ owned: false }), handlers);
      const input = findElement(element, (child) => child.props?.id === 'stl-model-edit-owned');

      expect(input).not.toBeNull();
      expect(input.props.onChange).toBe(handlers.onOwnedChange);
      expect(input.props.checked).toBe(false);
    });

    it('renders the type/url/size fields wired to their change handlers', function() {
      const handlers = buildHandlers();
      const element = StlModelEditHelper.render(buildState(), handlers);
      const typeSelect = findElement(element, (child) => child.props?.id === 'stl-model-edit-type');
      const urlField = findElement(element, (child) => child.props?.id === 'stl-model-edit-url');
      const sizeSelect = findElement(element, (child) => child.props?.id === 'stl-model-edit-size');

      expect(typeSelect.props.onChange).toBe(handlers.onTypeChange);
      expect(urlField.props.onChange).toBe(handlers.onUrlChange);
      expect(sizeSelect.props.onChange).toBe(handlers.onSizeChange);
    });

    it('renders the races/roles pickers wired to their change handlers with the current values', function() {
      const handlers = buildHandlers();
      const races = [{ id: 'elf', name: 'Elf' }];
      const roles = [{ id: 'wizard', name: 'Wizard' }];
      const element = StlModelEditHelper.render(buildState({ races, roles }), handlers);
      const pickers = [];
      findElement(element, (child) => {
        if (child.type === MultiResourcePickerField) pickers.push(child);
        return false;
      });
      const racesPicker = pickers.find((picker) => picker.props.value === races);
      const rolesPicker = pickers.find((picker) => picker.props.value === roles);

      expect(racesPicker.props.onChange).toBe(handlers.onRacesChange);
      expect(rolesPicker.props.onChange).toBe(handlers.onRolesChange);
    });

    it('does not render photo/tags/sources/collections fields', function() {
      const html = renderToStaticMarkup(StlModelEditHelper.render(buildState(), buildHandlers()));

      expect(html).not.toContain('tags');
      expect(html).not.toContain('sources');
      expect(html).not.toContain('collections');
    });

    it('renders the submit button', function() {
      const html = renderToStaticMarkup(StlModelEditHelper.render(buildState(), buildHandlers()));
      expect(html).toContain('type="submit"');
      expect(html).toContain('Save');
    });

    it('disables the submit button while submitting', function() {
      const html = renderToStaticMarkup(
        StlModelEditHelper.render(buildState({ status: 'submitting' }), buildHandlers()),
      );
      expect(html).toContain('disabled=""');
    });

    it('does not disable the submit button when status is idle', function() {
      const html = renderToStaticMarkup(StlModelEditHelper.render(buildState(), buildHandlers()));
      expect(html).not.toContain('disabled=""');
    });

    it('renders per-field errors when present', function() {
      const html = renderToStaticMarkup(
        StlModelEditHelper.render(buildState({ fieldErrors: { name: ['is required'] } }), buildHandlers()),
      );
      expect(html).toContain('is required');
    });

    it('renders a general error alert when status is error', function() {
      const html = renderToStaticMarkup(
        StlModelEditHelper.render(buildState({ status: 'error' }), buildHandlers()),
      );
      expect(html).toContain('Something went wrong. Please try again.');
    });

    it('does not render a general error alert when status is idle', function() {
      const html = renderToStaticMarkup(StlModelEditHelper.render(buildState(), buildHandlers()));
      expect(html).not.toContain('Something went wrong.');
    });
  });

  describe('.renderLoading', function() {
    it('renders a loading message', function() {
      expect(renderToStaticMarkup(StlModelEditHelper.renderLoading())).toContain('Loading STL model');
    });
  });
});
