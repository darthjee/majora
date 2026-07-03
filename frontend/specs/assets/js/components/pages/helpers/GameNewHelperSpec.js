import { renderToStaticMarkup } from 'react-dom/server';
import GameNewHelper from '../../../../../../assets/js/components/pages/helpers/GameNewHelper.jsx';

describe('GameNewHelper', function() {
  const buildHandlers = () => ({
    onSubmit: jasmine.createSpy('onSubmit'),
    onNameChange: jasmine.createSpy('onNameChange'),
    onDescriptionChange: jasmine.createSpy('onDescriptionChange'),
  });

  const buildState = (overrides = {}) => ({
    name: '',
    description: '',
    status: 'idle',
    fieldErrors: {},
    ...overrides,
  });

  describe('.render', function() {
    it('renders all expected form fields', function() {
      const html = renderToStaticMarkup(GameNewHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('id="game-new-name"');
      expect(html).toContain('id="game-new-description"');
    });

    it('renders the current field values', function() {
      const html = renderToStaticMarkup(
        GameNewHelper.render(
          buildState({ name: 'Epic Quest', description: 'An adventure.' }),
          buildHandlers(),
        ),
      );

      expect(html).toContain('value="Epic Quest"');
      expect(html).toContain('value="An adventure."');
    });

    it('renders the submit button', function() {
      const html = renderToStaticMarkup(GameNewHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('type="submit"');
      expect(html).toContain('Create Game');
    });

    it('disables the submit button while submitting', function() {
      const html = renderToStaticMarkup(
        GameNewHelper.render(buildState({ status: 'submitting' }), buildHandlers()),
      );

      expect(html).toContain('disabled=""');
    });

    it('does not disable the submit button when status is idle', function() {
      const html = renderToStaticMarkup(GameNewHelper.render(buildState(), buildHandlers()));

      expect(html).not.toContain('disabled=""');
    });

    it('renders per-field errors when present', function() {
      const html = renderToStaticMarkup(
        GameNewHelper.render(
          buildState({ fieldErrors: { name: ['is too short'] } }),
          buildHandlers(),
        ),
      );

      expect(html).toContain('is too short');
      expect(html).toContain('alert-danger');
    });

    it('renders no field error alerts when none are present', function() {
      const html = renderToStaticMarkup(GameNewHelper.render(buildState(), buildHandlers()));

      expect(html).not.toContain('alert-danger');
    });

    it('renders a general error alert when status is error', function() {
      const html = renderToStaticMarkup(
        GameNewHelper.render(buildState({ status: 'error' }), buildHandlers()),
      );

      expect(html).toContain('Failed to create game. Please try again.');
      expect(html).toContain('alert');
    });

    it('does not render a general error alert when status is idle', function() {
      const html = renderToStaticMarkup(GameNewHelper.render(buildState(), buildHandlers()));

      expect(html).not.toContain('Failed to create game.');
    });

    it('does not render an upload photo button', function() {
      const html = renderToStaticMarkup(GameNewHelper.render(buildState(), buildHandlers()));

      expect(html).not.toContain('Upload Photo');
    });
  });

  describe('.renderLoading', function() {
    it('renders a loading message', function() {
      expect(renderToStaticMarkup(GameNewHelper.renderLoading())).toContain('Loading game');
    });
  });
});
