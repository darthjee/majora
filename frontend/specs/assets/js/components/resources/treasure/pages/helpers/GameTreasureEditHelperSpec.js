import { renderToStaticMarkup } from 'react-dom/server';
import GameTreasureEditHelper from '../../../../../../../../assets/js/components/resources/treasure/pages/helpers/GameTreasureEditHelper.jsx';
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

describe('GameTreasureEditHelper', function() {
  const buildHandlers = () => ({
    onSubmit: jasmine.createSpy('onSubmit'),
    onNameChange: jasmine.createSpy('onNameChange'),
    onOpenValueModal: jasmine.createSpy('onOpenValueModal'),
    onMaxUnitsChange: jasmine.createSpy('onMaxUnitsChange'),
  });

  const buildState = (overrides = {}) => ({
    name: 'Golden Crown',
    value: '500',
    maxUnits: '10',
    status: 'idle',
    fieldErrors: {},
    isExclusive: false,
    ...overrides,
  });

  describe('.render', function() {
    it('renders all expected form fields', function() {
      const html = renderToStaticMarkup(GameTreasureEditHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('id="game-treasure-edit-name"');
      expect(html).toContain('id="game-treasure-edit-max-units"');
    });

    it('does not render a raw numeric value input', function() {
      const html = renderToStaticMarkup(GameTreasureEditHelper.render(buildState(), buildHandlers()));

      expect(html).not.toContain('id="game-treasure-edit-value"');
    });

    it('renders the collapsed CP/SP/GP breakdown of the current value', function() {
      const html = renderToStaticMarkup(GameTreasureEditHelper.render(buildState({ value: '500' }), buildHandlers()));

      expect(html).toContain('5 GP');
    });

    it('renders a cents/dollars breakdown when gameType is deadlands', function() {
      const html = renderToStaticMarkup(
        GameTreasureEditHelper.render(buildState({ value: '350', gameType: 'deadlands' }), buildHandlers())
      );

      expect(html).toContain('3 Dollars and 50 Cents');
    });

    it('renders a TreasureValueField wired to onOpenValueModal', function() {
      const handlers = buildHandlers();
      const element = GameTreasureEditHelper.render(buildState(), handlers);
      const field = findElement(element, (child) => child.type === TreasureValueField);

      expect(field).not.toBeNull();
      expect(field.props.onOpenModal).toBe(handlers.onOpenValueModal);
    });

    it('does not render the max_units field when the treasure is exclusive to the game', function() {
      const html = renderToStaticMarkup(
        GameTreasureEditHelper.render(buildState({ isExclusive: true }), buildHandlers()),
      );

      expect(html).toContain('id="game-treasure-edit-name"');
      expect(html).not.toContain('id="game-treasure-edit-max-units"');
    });

    it('renders the max_units field when the treasure is linked (not exclusive)', function() {
      const html = renderToStaticMarkup(
        GameTreasureEditHelper.render(buildState({ isExclusive: false }), buildHandlers()),
      );

      expect(html).toContain('id="game-treasure-edit-max-units"');
    });

    it('renders the current field values', function() {
      const html = renderToStaticMarkup(GameTreasureEditHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('value="Golden Crown"');
      expect(html).toContain('value="10"');
    });

    it('renders an empty max units field value when maxUnits is an empty string', function() {
      const html = renderToStaticMarkup(
        GameTreasureEditHelper.render(buildState({ maxUnits: '' }), buildHandlers()),
      );

      expect(html).toContain('id="game-treasure-edit-max-units"');
    });

    it('renders max_units field errors when present', function() {
      const html = renderToStaticMarkup(
        GameTreasureEditHelper.render(
          buildState({ fieldErrors: { max_units: ['must be a positive integer'] } }),
          buildHandlers(),
        ),
      );

      expect(html).toContain('must be a positive integer');
      expect(html).toContain('alert-danger');
    });

    it('renders value field errors when present', function() {
      const html = renderToStaticMarkup(
        GameTreasureEditHelper.render(
          buildState({ fieldErrors: { value: ['must be a positive integer'] } }),
          buildHandlers(),
        ),
      );

      expect(html).toContain('must be a positive integer');
      expect(html).toContain('alert-danger');
    });

    it('renders the submit button', function() {
      const html = renderToStaticMarkup(GameTreasureEditHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('type="submit"');
      expect(html).toContain('Save changes');
    });

    it('disables the submit button while submitting', function() {
      const html = renderToStaticMarkup(
        GameTreasureEditHelper.render(buildState({ status: 'submitting' }), buildHandlers()),
      );

      expect(html).toContain('disabled=""');
    });

    it('does not disable the submit button when status is idle', function() {
      const html = renderToStaticMarkup(GameTreasureEditHelper.render(buildState(), buildHandlers()));

      expect(html).not.toContain('disabled=""');
    });

    it('renders per-field errors when present', function() {
      const html = renderToStaticMarkup(
        GameTreasureEditHelper.render(
          buildState({ fieldErrors: { name: ['is too short'] } }),
          buildHandlers(),
        ),
      );

      expect(html).toContain('is too short');
      expect(html).toContain('alert-danger');
    });

    it('renders no field error alerts when none are present', function() {
      const html = renderToStaticMarkup(GameTreasureEditHelper.render(buildState(), buildHandlers()));

      expect(html).not.toContain('alert-danger');
    });

    it('renders a general error alert when status is error', function() {
      const html = renderToStaticMarkup(
        GameTreasureEditHelper.render(buildState({ status: 'error' }), buildHandlers()),
      );

      expect(html).toContain('Failed to save treasure. Please try again.');
      expect(html).toContain('alert');
    });

    it('does not render a general error alert when status is idle', function() {
      const html = renderToStaticMarkup(GameTreasureEditHelper.render(buildState(), buildHandlers()));

      expect(html).not.toContain('Failed to save treasure.');
    });
  });

  describe('.renderLoading', function() {
    it('renders a loading message', function() {
      expect(renderToStaticMarkup(GameTreasureEditHelper.renderLoading())).toContain('Loading treasures');
    });
  });

  describe('.renderError', function() {
    it('renders the error in an alert', function() {
      const html = renderToStaticMarkup(GameTreasureEditHelper.renderError('Something went wrong'));
      expect(html).toContain('Something went wrong');
      expect(html).toContain('alert');
    });
  });
});
