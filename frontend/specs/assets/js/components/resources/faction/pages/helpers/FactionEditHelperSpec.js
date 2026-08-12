import { renderToStaticMarkup } from 'react-dom/server';
import FactionEditHelper
  from '../../../../../../../../assets/js/components/resources/faction/pages/helpers/FactionEditHelper.jsx';

const buildState = (overrides = {}) => ({
  name: 'The Silver Hand',
  photo_path: null,
  status: 'idle',
  fieldErrors: {},
  ...overrides,
});

const buildHandlers = (overrides = {}) => ({
  onSubmit: jasmine.createSpy('onSubmit'),
  onNameChange: jasmine.createSpy('onNameChange'),
  onOpenUploadModal: jasmine.createSpy('onOpenUploadModal'),
  ...overrides,
});

describe('FactionEditHelper', function() {
  describe('.render', function() {
    it('renders the faction name in the name field', function() {
      const html = renderToStaticMarkup(FactionEditHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('The Silver Hand');
    });

    it('renders field errors for the name field', function() {
      const state = buildState({ fieldErrors: { name: ['is too short'] } });
      const html = renderToStaticMarkup(FactionEditHelper.render(state, buildHandlers()));

      expect(html).toContain('is too short');
    });

    it('renders the error alert when status is error', function() {
      const html = renderToStaticMarkup(
        FactionEditHelper.render(buildState({ status: 'error' }), buildHandlers()),
      );

      expect(html).toContain('Failed to save faction. Please try again.');
    });

    it('does not render the error alert otherwise', function() {
      const html = renderToStaticMarkup(FactionEditHelper.render(buildState(), buildHandlers()));

      expect(html).not.toContain('Failed to save faction. Please try again.');
    });

    it('disables the submit button while submitting', function() {
      const html = renderToStaticMarkup(
        FactionEditHelper.render(buildState({ status: 'submitting' }), buildHandlers()),
      );

      expect(html).toContain('disabled=""');
    });

    it('renders the faction photo', function() {
      const html = renderToStaticMarkup(
        FactionEditHelper.render(buildState({ photo_path: '/faction.png' }), buildHandlers()),
      );

      expect(html).toContain('/faction.png');
    });

    it('passes the upload handler through to the show page layout context', function() {
      const handlers = buildHandlers();
      const element = FactionEditHelper.render(buildState(), handlers);

      expect(element.props.context.handlers.onOpenUploadModal).toBe(handlers.onOpenUploadModal);
    });
  });

  describe('.renderLoading', function() {
    it('renders the loading message', function() {
      const html = renderToStaticMarkup(FactionEditHelper.renderLoading());

      expect(html).toContain('Loading faction...');
    });
  });

  describe('.renderError', function() {
    it('renders the error message', function() {
      const html = renderToStaticMarkup(FactionEditHelper.renderError('boom'));

      expect(html).toContain('boom');
    });
  });
});
