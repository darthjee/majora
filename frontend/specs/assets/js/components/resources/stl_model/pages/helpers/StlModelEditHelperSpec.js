import { renderToStaticMarkup } from 'react-dom/server';
import StlModelEditHelper
  from '../../../../../../../../assets/js/components/resources/stl_model/pages/helpers/StlModelEditHelper.jsx';

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
    onRaceChange: jasmine.createSpy('onRaceChange'),
    onRoleChange: jasmine.createSpy('onRoleChange'),
  });

  const buildState = (overrides = {}) => ({
    name: 'Goblin Miniature',
    owned: true,
    type: 'creature',
    race: '',
    role: '',
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

    it('renders the type/race/role selects wired to their change handlers', function() {
      const handlers = buildHandlers();
      const element = StlModelEditHelper.render(buildState(), handlers);
      const typeSelect = findElement(element, (child) => child.props?.id === 'stl-model-edit-type');
      const raceSelect = findElement(element, (child) => child.props?.id === 'stl-model-edit-race');
      const roleSelect = findElement(element, (child) => child.props?.id === 'stl-model-edit-role');

      expect(typeSelect.props.onChange).toBe(handlers.onTypeChange);
      expect(raceSelect.props.onChange).toBe(handlers.onRaceChange);
      expect(roleSelect.props.onChange).toBe(handlers.onRoleChange);
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
