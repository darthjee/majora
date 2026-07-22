import { renderToStaticMarkup } from 'react-dom/server';
import GameTreasureNewHelper from '../../../../../../../../assets/js/components/resources/treasure/pages/helpers/GameTreasureNewHelper.jsx';

describe('GameTreasureNewHelper', function() {
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
      const html = renderToStaticMarkup(GameTreasureNewHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('id="game-treasure-new-name"');
    });

    it('does not render a raw numeric value input', function() {
      const html = renderToStaticMarkup(GameTreasureNewHelper.render(buildState(), buildHandlers()));

      expect(html).not.toContain('id="game-treasure-new-value"');
    });

    it('renders the current field values', function() {
      const html = renderToStaticMarkup(GameTreasureNewHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('value="Golden Crown"');
    });

    it('renders the collapsed CP/SP/GP breakdown of the current value', function() {
      const html = renderToStaticMarkup(GameTreasureNewHelper.render(buildState({ value: '500' }), buildHandlers()));

      expect(html).toContain('5 GP');
    });

    it('renders a "$ dollars,cents" value when gameType is deadlands', function() {
      const html = renderToStaticMarkup(
        GameTreasureNewHelper.render(buildState({ value: '350', gameType: 'deadlands' }), buildHandlers())
      );

      expect(html).toContain('$ 3,50');
    });

    it('does not render a currency-type dropdown', function() {
      const html = renderToStaticMarkup(GameTreasureNewHelper.render(buildState(), buildHandlers()));

      expect(html).not.toContain('id="game-treasure-new-type"');
    });

    it('passes the value modal handler through to the show page layout context', function() {
      const handlers = buildHandlers();
      const element = GameTreasureNewHelper.render(buildState(), handlers);

      expect(element.props.context.handlers.onOpenValueModal).toBe(handlers.onOpenValueModal);
    });

    it('renders the submit button', function() {
      const html = renderToStaticMarkup(GameTreasureNewHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('type="submit"');
      expect(html).toContain('Create Treasure');
    });

    it('disables the submit button while submitting', function() {
      const html = renderToStaticMarkup(
        GameTreasureNewHelper.render(buildState({ status: 'submitting' }), buildHandlers()),
      );

      expect(html).toContain('disabled=""');
    });

    it('does not disable the submit button when status is idle', function() {
      const html = renderToStaticMarkup(GameTreasureNewHelper.render(buildState(), buildHandlers()));

      expect(html).not.toContain('disabled=""');
    });

    it('renders per-field errors when present', function() {
      const html = renderToStaticMarkup(
        GameTreasureNewHelper.render(
          buildState({ fieldErrors: { name: ['is required'] } }),
          buildHandlers(),
        ),
      );

      expect(html).toContain('is required');
      expect(html).toContain('alert-danger');
    });

    it('renders value field errors when present', function() {
      const html = renderToStaticMarkup(
        GameTreasureNewHelper.render(
          buildState({ fieldErrors: { value: ['must be a positive integer'] } }),
          buildHandlers(),
        ),
      );

      expect(html).toContain('must be a positive integer');
      expect(html).toContain('alert-danger');
    });

    it('renders no field error alerts when none are present', function() {
      const html = renderToStaticMarkup(GameTreasureNewHelper.render(buildState(), buildHandlers()));

      expect(html).not.toContain('alert-danger');
    });

    it('renders a general error alert when status is error', function() {
      const html = renderToStaticMarkup(
        GameTreasureNewHelper.render(buildState({ status: 'error' }), buildHandlers()),
      );

      expect(html).toContain('Failed to create treasure. Please try again.');
      expect(html).toContain('alert');
    });

    it('does not render a general error alert when status is idle', function() {
      const html = renderToStaticMarkup(GameTreasureNewHelper.render(buildState(), buildHandlers()));

      expect(html).not.toContain('Failed to create treasure.');
    });
  });
});
