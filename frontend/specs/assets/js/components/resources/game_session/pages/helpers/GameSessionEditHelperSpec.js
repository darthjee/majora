import { renderToStaticMarkup } from 'react-dom/server';
import GameSessionEditHelper from '../../../../../../../../assets/js/components/resources/game_session/pages/helpers/GameSessionEditHelper.jsx';

describe('GameSessionEditHelper', function() {
  const buildHandlers = () => ({
    onSubmit: jasmine.createSpy('onSubmit'),
    onTitleChange: jasmine.createSpy('onTitleChange'),
    onDateChange: jasmine.createSpy('onDateChange'),
    onDescriptionChange: jasmine.createSpy('onDescriptionChange'),
  });

  const buildState = (overrides = {}) => ({
    title: 'Session 1',
    date: '2024-01-01',
    description: 'A thrilling encounter.',
    status: 'idle',
    fieldErrors: {},
    ...overrides,
  });

  describe('.render', function() {
    it('renders all expected form fields', function() {
      const html = renderToStaticMarkup(GameSessionEditHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('id="game-session-edit-title"');
      expect(html).toContain('id="game-session-edit-date"');
      expect(html).toContain('id="game-session-edit-description"');
    });

    it('renders the current field values', function() {
      const html = renderToStaticMarkup(GameSessionEditHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('value="Session 1"');
      expect(html).toContain('value="2024-01-01"');
      expect(html).toContain('A thrilling encounter.');
    });

    it('renders the submit button', function() {
      const html = renderToStaticMarkup(GameSessionEditHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('type="submit"');
      expect(html).toContain('Save changes');
    });

    it('disables the submit button while submitting', function() {
      const html = renderToStaticMarkup(
        GameSessionEditHelper.render(buildState({ status: 'submitting' }), buildHandlers()),
      );

      expect(html).toContain('disabled=""');
    });

    it('does not disable the submit button when status is idle', function() {
      const html = renderToStaticMarkup(GameSessionEditHelper.render(buildState(), buildHandlers()));

      expect(html).not.toContain('disabled=""');
    });

    it('renders per-field errors when present', function() {
      const html = renderToStaticMarkup(
        GameSessionEditHelper.render(
          buildState({ fieldErrors: { title: ['is too short'] } }),
          buildHandlers(),
        ),
      );

      expect(html).toContain('is too short');
      expect(html).toContain('alert-danger');
    });

    it('renders per-field errors for description when present', function() {
      const html = renderToStaticMarkup(
        GameSessionEditHelper.render(
          buildState({ fieldErrors: { description: ['is too long'] } }),
          buildHandlers(),
        ),
      );

      expect(html).toContain('is too long');
      expect(html).toContain('alert-danger');
    });

    it('renders no field error alerts when none are present', function() {
      const html = renderToStaticMarkup(GameSessionEditHelper.render(buildState(), buildHandlers()));

      expect(html).not.toContain('alert-danger');
    });

    it('renders a general error alert when status is error', function() {
      const html = renderToStaticMarkup(
        GameSessionEditHelper.render(buildState({ status: 'error' }), buildHandlers()),
      );

      expect(html).toContain('Failed to save session. Please try again.');
      expect(html).toContain('alert');
    });

    it('does not render a general error alert when status is idle', function() {
      const html = renderToStaticMarkup(GameSessionEditHelper.render(buildState(), buildHandlers()));

      expect(html).not.toContain('Failed to save session.');
    });
  });

  describe('.renderLoading', function() {
    it('renders a loading message', function() {
      expect(renderToStaticMarkup(GameSessionEditHelper.renderLoading())).toContain('Loading session');
    });
  });
});
