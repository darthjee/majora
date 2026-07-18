import { renderToStaticMarkup } from 'react-dom/server';
import TreasureEditHelper from '../../../../../../../../assets/js/components/resources/treasure/pages/helpers/TreasureEditHelper.jsx';
import TreasureValueField from '../../../../../../../../assets/js/components/resources/treasure/pages/elements/TreasureValueField.jsx';

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

describe('TreasureEditHelper', function() {
  const buildHandlers = () => ({
    onSubmit: jasmine.createSpy('onSubmit'),
    onNameChange: jasmine.createSpy('onNameChange'),
    onOpenValueModal: jasmine.createSpy('onOpenValueModal'),
  });

  const buildState = (overrides = {}) => ({
    name: 'Golden Crown',
    value: '500',
    status: 'idle',
    fieldErrors: {},
    ...overrides,
  });

  describe('.render', function() {
    it('renders all expected form fields', function() {
      const html = renderToStaticMarkup(TreasureEditHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('id="treasure-edit-name"');
    });

    it('does not render a raw numeric value input', function() {
      const html = renderToStaticMarkup(TreasureEditHelper.render(buildState(), buildHandlers()));

      expect(html).not.toContain('id="treasure-edit-value"');
    });

    it('renders the current field values', function() {
      const html = renderToStaticMarkup(TreasureEditHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('value="Golden Crown"');
    });

    it('renders the collapsed CP/SP/GP breakdown of the current value', function() {
      const html = renderToStaticMarkup(TreasureEditHelper.render(buildState({ value: '500' }), buildHandlers()));

      expect(html).toContain('5 GP');
    });

    it('renders a "$ dollars,cents" value when gameType is deadlands', function() {
      const html = renderToStaticMarkup(
        TreasureEditHelper.render(buildState({ value: '350', gameType: 'deadlands' }), buildHandlers())
      );

      expect(html).toContain('$ 3,50');
    });

    it('does not render a currency-type dropdown', function() {
      const html = renderToStaticMarkup(TreasureEditHelper.render(buildState(), buildHandlers()));

      expect(html).not.toContain('id="treasure-edit-type"');
    });

    it('renders a TreasureValueField wired to onOpenValueModal', function() {
      const handlers = buildHandlers();
      const element = TreasureEditHelper.render(buildState(), handlers);
      const field = findElement(element, (child) => child.type === TreasureValueField);

      expect(field).not.toBeNull();
      expect(field.props.onOpenModal).toBe(handlers.onOpenValueModal);
    });

    it('renders the submit button', function() {
      const html = renderToStaticMarkup(TreasureEditHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('type="submit"');
      expect(html).toContain('Save changes');
    });

    it('disables the submit button while submitting', function() {
      const html = renderToStaticMarkup(
        TreasureEditHelper.render(buildState({ status: 'submitting' }), buildHandlers()),
      );

      expect(html).toContain('disabled=""');
    });

    it('does not disable the submit button when status is idle', function() {
      const html = renderToStaticMarkup(TreasureEditHelper.render(buildState(), buildHandlers()));

      expect(html).not.toContain('disabled=""');
    });

    it('renders per-field errors when present', function() {
      const html = renderToStaticMarkup(
        TreasureEditHelper.render(
          buildState({ fieldErrors: { name: ['is too short'] } }),
          buildHandlers(),
        ),
      );

      expect(html).toContain('is too short');
      expect(html).toContain('alert-danger');
    });

    it('renders value field errors when present', function() {
      const html = renderToStaticMarkup(
        TreasureEditHelper.render(
          buildState({ fieldErrors: { value: ['must be a positive integer'] } }),
          buildHandlers(),
        ),
      );

      expect(html).toContain('must be a positive integer');
      expect(html).toContain('alert-danger');
    });

    it('renders no field error alerts when none are present', function() {
      const html = renderToStaticMarkup(TreasureEditHelper.render(buildState(), buildHandlers()));

      expect(html).not.toContain('alert-danger');
    });

    it('renders a general error alert when status is error', function() {
      const html = renderToStaticMarkup(
        TreasureEditHelper.render(buildState({ status: 'error' }), buildHandlers()),
      );

      expect(html).toContain('Failed to save treasure. Please try again.');
      expect(html).toContain('alert');
    });

    it('does not render a general error alert when status is idle', function() {
      const html = renderToStaticMarkup(TreasureEditHelper.render(buildState(), buildHandlers()));

      expect(html).not.toContain('Failed to save treasure.');
    });
  });

  describe('.renderLoading', function() {
    it('renders a loading message', function() {
      expect(renderToStaticMarkup(TreasureEditHelper.renderLoading())).toContain('Loading treasure');
    });
  });
});
