import { renderToStaticMarkup } from 'react-dom/server';
import GameTreasureEditHelper from '../../../../../../assets/js/components/pages/helpers/GameTreasureEditHelper.jsx';

describe('GameTreasureEditHelper', function() {
  const buildHandlers = () => ({
    onSubmit: jasmine.createSpy('onSubmit'),
    onNameChange: jasmine.createSpy('onNameChange'),
    onValueChange: jasmine.createSpy('onValueChange'),
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
      const html = renderToStaticMarkup(GameTreasureEditHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('id="game-treasure-edit-name"');
      expect(html).toContain('id="game-treasure-edit-value"');
    });

    it('renders the current field values', function() {
      const html = renderToStaticMarkup(GameTreasureEditHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('value="Golden Crown"');
      expect(html).toContain('value="500"');
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
