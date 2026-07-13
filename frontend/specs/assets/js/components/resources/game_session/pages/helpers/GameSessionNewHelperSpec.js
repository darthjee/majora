import { renderToStaticMarkup } from 'react-dom/server';
import GameSessionNewHelper from '../../../../../../../../assets/js/components/resources/game_session/pages/helpers/GameSessionNewHelper.jsx';

describe('GameSessionNewHelper', function() {
  const buildHandlers = () => ({
    onSubmit: jasmine.createSpy('onSubmit'),
    onTitleChange: jasmine.createSpy('onTitleChange'),
    onDateChange: jasmine.createSpy('onDateChange'),
  });

  const buildState = (overrides = {}) => ({
    title: 'Session 1',
    date: '2024-01-01',
    status: 'idle',
    fieldErrors: {},
    ...overrides,
  });

  describe('.render', function() {
    it('renders all expected form fields', function() {
      const html = renderToStaticMarkup(GameSessionNewHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('id="game-session-new-title"');
      expect(html).toContain('id="game-session-new-date"');
    });

    it('renders the current field values', function() {
      const html = renderToStaticMarkup(GameSessionNewHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('value="Session 1"');
      expect(html).toContain('value="2024-01-01"');
    });

    it('renders the submit button', function() {
      const html = renderToStaticMarkup(GameSessionNewHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('type="submit"');
      expect(html).toContain('Create Session');
    });

    it('disables the submit button while submitting', function() {
      const html = renderToStaticMarkup(
        GameSessionNewHelper.render(buildState({ status: 'submitting' }), buildHandlers()),
      );

      expect(html).toContain('disabled=""');
    });

    it('does not disable the submit button when status is idle', function() {
      const html = renderToStaticMarkup(GameSessionNewHelper.render(buildState(), buildHandlers()));

      expect(html).not.toContain('disabled=""');
    });

    it('renders per-field errors when present', function() {
      const html = renderToStaticMarkup(
        GameSessionNewHelper.render(
          buildState({ fieldErrors: { title: ['is required'] } }),
          buildHandlers(),
        ),
      );

      expect(html).toContain('is required');
      expect(html).toContain('alert-danger');
    });

    it('renders no field error alerts when none are present', function() {
      const html = renderToStaticMarkup(GameSessionNewHelper.render(buildState(), buildHandlers()));

      expect(html).not.toContain('alert-danger');
    });

    it('renders a general error alert when status is error', function() {
      const html = renderToStaticMarkup(
        GameSessionNewHelper.render(buildState({ status: 'error' }), buildHandlers()),
      );

      expect(html).toContain('Failed to create session. Please try again.');
      expect(html).toContain('alert');
    });

    it('does not render a general error alert when status is idle', function() {
      const html = renderToStaticMarkup(GameSessionNewHelper.render(buildState(), buildHandlers()));

      expect(html).not.toContain('Failed to create session.');
    });
  });
});
