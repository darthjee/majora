import { renderToStaticMarkup } from 'react-dom/server';
import GameEditHelper from '../../../../../../../../assets/js/components/resources/game/pages/helpers/GameEditHelper.jsx';

describe('GameEditHelper', function() {
  const buildHandlers = () => ({
    onSubmit: jasmine.createSpy('onSubmit'),
    onNameChange: jasmine.createSpy('onNameChange'),
    onDescriptionChange: jasmine.createSpy('onDescriptionChange'),
    onOpenUploadModal: jasmine.createSpy('onOpenUploadModal'),
  });

  const buildState = (overrides = {}) => ({
    name: 'Epic Quest',
    description: 'A heroic adventure.',
    status: 'idle',
    fieldErrors: {},
    ...overrides,
  });

  describe('.render', function() {
    it('renders all expected form fields', function() {
      const html = renderToStaticMarkup(GameEditHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('id="game-edit-name"');
      expect(html).toContain('id="game-edit-description"');
    });

    it('renders the current field values', function() {
      const html = renderToStaticMarkup(GameEditHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('value="Epic Quest"');
      expect(html).toContain('>A heroic adventure.</textarea>');
    });

    it('renders the submit button', function() {
      const html = renderToStaticMarkup(GameEditHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('type="submit"');
      expect(html).toContain('Save changes');
    });

    it('disables the submit button while submitting', function() {
      const html = renderToStaticMarkup(
        GameEditHelper.render(buildState({ status: 'submitting' }), buildHandlers()),
      );

      expect(html).toContain('disabled=""');
    });

    it('does not disable the submit button when status is idle', function() {
      const html = renderToStaticMarkup(GameEditHelper.render(buildState(), buildHandlers()));

      expect(html).not.toContain('disabled=""');
    });

    it('renders per-field errors when present', function() {
      const html = renderToStaticMarkup(
        GameEditHelper.render(
          buildState({ fieldErrors: { name: ['is too short'] } }),
          buildHandlers(),
        ),
      );

      expect(html).toContain('is too short');
      expect(html).toContain('alert-danger');
    });

    it('renders no field error alerts when none are present', function() {
      const html = renderToStaticMarkup(GameEditHelper.render(buildState(), buildHandlers()));

      expect(html).not.toContain('alert-danger');
    });

    it('renders a general error alert when status is error', function() {
      const html = renderToStaticMarkup(
        GameEditHelper.render(buildState({ status: 'error' }), buildHandlers()),
      );

      expect(html).toContain('Failed to save game. Please try again.');
      expect(html).toContain('alert');
    });

    it('does not render a general error alert when status is idle', function() {
      const html = renderToStaticMarkup(GameEditHelper.render(buildState(), buildHandlers()));

      expect(html).not.toContain('Failed to save game.');
    });

    it('renders the upload photo button', function() {
      const html = renderToStaticMarkup(GameEditHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('Upload Photo');
    });

    it('passes the upload handler through to the show page layout context', function() {
      const handlers = buildHandlers();
      const element = GameEditHelper.render(buildState(), handlers);

      expect(element.props.context.handlers.onOpenUploadModal).toBe(handlers.onOpenUploadModal);
    });

    it('passes the cover_photo_path through to the show page layout context', function() {
      const element = GameEditHelper.render(
        buildState({ cover_photo_path: 'http://example.com/cover.png' }),
        buildHandlers(),
      );

      expect(element.props.context.cover_photo_path).toBe('http://example.com/cover.png');
    });
  });

  describe('.renderLoading', function() {
    it('renders a loading message', function() {
      expect(renderToStaticMarkup(GameEditHelper.renderLoading())).toContain('Loading game');
    });
  });
});
