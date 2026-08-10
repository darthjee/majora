import { renderToStaticMarkup } from 'react-dom/server';
import SourceHelper from '../../../../../../../../assets/js/components/resources/source/pages/helpers/SourceHelper.jsx';
import { buildSource } from '../../../../../../../support/factories.js';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';

describe('SourceHelper', function() {
  const handlers = { onOpenUploadModal: Noop.noop };

  describe('.render', function() {
    it('renders the source name', function() {
      const source = buildSource({ name: 'MyMiniFactory' });
      expect(renderToStaticMarkup(SourceHelper.render(source, false, handlers))).toContain('MyMiniFactory');
    });

    it('renders a back button to the sources index', function() {
      const html = renderToStaticMarkup(SourceHelper.render(buildSource(), false, handlers));
      expect(html).toContain('href="#/miniatures/sources"');
    });

    it('renders the photo', function() {
      const html = renderToStaticMarkup(
        SourceHelper.render(buildSource({ photo_url: 'http://example.com/photo.png' }), false, handlers),
      );
      expect(html).toContain('http://example.com/photo.png');
    });

    it('does not render a url link when url is empty', function() {
      const html = renderToStaticMarkup(SourceHelper.render(buildSource({ url: '' }), false, handlers));
      expect(html).not.toContain('target="_blank"');
    });

    it('renders the url as an anchor tag when present', function() {
      const source = buildSource({ url: 'http://example.com/source' });
      const html = renderToStaticMarkup(SourceHelper.render(source, false, handlers));

      expect(html).toContain('href="http://example.com/source"');
      expect(html).toContain('target="_blank"');
    });

    it('renders the upload button when isStaffOrSuperUser is true', function() {
      const html = renderToStaticMarkup(SourceHelper.render(buildSource(), true, handlers));
      expect(html).toContain('actions-overlay-button');
    });

    it('does not render the upload button when isStaffOrSuperUser is false', function() {
      const html = renderToStaticMarkup(SourceHelper.render(buildSource(), false, handlers));
      expect(html).not.toContain('actions-overlay-button');
    });
  });

  describe('.renderLoading', function() {
    it('renders a loading message', function() {
      expect(renderToStaticMarkup(SourceHelper.renderLoading())).toContain('Loading source');
    });
  });

  describe('.renderError', function() {
    it('renders the error message in an alert', function() {
      const html = renderToStaticMarkup(SourceHelper.renderError('Something went wrong'));
      expect(html).toContain('Something went wrong');
      expect(html).toContain('alert');
    });
  });
});
