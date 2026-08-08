import { renderToStaticMarkup } from 'react-dom/server';
import StlModelNewHelper
  from '../../../../../../../../assets/js/components/resources/stl_model/pages/helpers/StlModelNewHelper.jsx';

describe('StlModelNewHelper', function() {
  const buildHandlers = () => ({
    onSubmit: jasmine.createSpy('onSubmit'),
    onNameChange: jasmine.createSpy('onNameChange'),
    onTagInputChange: jasmine.createSpy('onTagInputChange'),
    onAddTag: jasmine.createSpy('onAddTag'),
    onOpenUploadModal: jasmine.createSpy('onOpenUploadModal'),
    onRetryPhotoUpload: jasmine.createSpy('onRetryPhotoUpload'),
    onSkipPhotoUpload: jasmine.createSpy('onSkipPhotoUpload'),
  });

  const buildState = (overrides = {}) => ({
    name: 'Goblin Miniature',
    tags: ['goblin'],
    tagInput: '',
    status: 'idle',
    fieldErrors: {},
    photoPreviewUrl: null,
    ...overrides,
  });

  describe('.render', function() {
    it('renders the name field', function() {
      const html = renderToStaticMarkup(StlModelNewHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('id="stl-model-new-name"');
    });

    it('renders the current name value', function() {
      const html = renderToStaticMarkup(StlModelNewHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('value="Goblin Miniature"');
    });

    it('renders the tags field with the pending tags', function() {
      const html = renderToStaticMarkup(StlModelNewHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('id="stl-model-new-tags"');
      expect(html).toContain('goblin');
    });

    it('renders the photo field', function() {
      const html = renderToStaticMarkup(StlModelNewHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('default_stl_model.png');
    });

    it('renders the given photo preview url when present', function() {
      const html = renderToStaticMarkup(
        StlModelNewHelper.render(buildState({ photoPreviewUrl: 'blob:http://example.com/preview' }), buildHandlers()),
      );

      expect(html).toContain('blob:http://example.com/preview');
    });

    it('renders the submit button', function() {
      const html = renderToStaticMarkup(StlModelNewHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('type="submit"');
      expect(html).toContain('Create STL Model');
    });

    it('disables the submit button while submitting', function() {
      const html = renderToStaticMarkup(
        StlModelNewHelper.render(buildState({ status: 'submitting' }), buildHandlers()),
      );

      expect(html).toContain('disabled=""');
    });

    it('does not disable the submit button when status is idle', function() {
      const html = renderToStaticMarkup(StlModelNewHelper.render(buildState(), buildHandlers()));

      expect(html).not.toContain('disabled=""');
    });

    it('renders per-field errors when present', function() {
      const html = renderToStaticMarkup(
        StlModelNewHelper.render(buildState({ fieldErrors: { name: ['is required'] } }), buildHandlers()),
      );

      expect(html).toContain('is required');
      expect(html).toContain('alert-danger');
    });

    it('renders no field error alerts when none are present', function() {
      const html = renderToStaticMarkup(StlModelNewHelper.render(buildState(), buildHandlers()));

      expect(html).not.toContain('alert-danger');
    });

    it('renders a general error alert when status is error', function() {
      const html = renderToStaticMarkup(StlModelNewHelper.render(buildState({ status: 'error' }), buildHandlers()));

      expect(html).toContain('Failed to create STL model. Please try again.');
      expect(html).toContain('alert');
    });

    it('does not render a general error alert when status is idle', function() {
      const html = renderToStaticMarkup(StlModelNewHelper.render(buildState(), buildHandlers()));

      expect(html).not.toContain('Failed to create STL model.');
    });

    it('renders the photo-upload-failed warning with retry/skip actions when status is photo-upload-failed', function() {
      const html = renderToStaticMarkup(
        StlModelNewHelper.render(buildState({ status: 'photo-upload-failed' }), buildHandlers()),
      );

      expect(html).toContain('alert-warning');
      expect(html).toContain('Retry photo upload');
      expect(html).toContain('Skip and continue');
    });

    it('does not render the photo-upload-failed warning when status is idle', function() {
      const html = renderToStaticMarkup(StlModelNewHelper.render(buildState(), buildHandlers()));

      expect(html).not.toContain('alert-warning');
    });
  });

  describe('.renderLoading', function() {
    it('renders a loading message', function() {
      expect(renderToStaticMarkup(StlModelNewHelper.renderLoading())).toContain('Loading STL model');
    });
  });
});
