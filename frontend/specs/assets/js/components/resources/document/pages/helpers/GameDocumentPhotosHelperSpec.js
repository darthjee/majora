import { renderToStaticMarkup } from 'react-dom/server';
import GameDocumentPhotosHelper
  from '../../../../../../../../assets/js/components/resources/document/pages/helpers/GameDocumentPhotosHelper.jsx';

describe('GameDocumentPhotosHelper', function() {
  const photos = [{ id: 1, path: '/photos/1.jpg' }, { id: 2, path: '/photos/2.jpg' }];
  const pagination = { page: 1, pages: 2, perPage: 10 };
  const basePath = '#/games/demo/documents/9/photos';
  const backHref = '#/games/demo/documents/9';

  describe('.render', function() {
    it('renders a card for each photo', function() {
      const html = renderToStaticMarkup(GameDocumentPhotosHelper.render(photos, pagination, basePath, backHref));
      expect(html).toContain('/photos/1.jpg');
      expect(html).toContain('/photos/2.jpg');
    });

    it('renders a back button to the document detail page', function() {
      const html = renderToStaticMarkup(GameDocumentPhotosHelper.render(photos, pagination, basePath, backHref));
      expect(html).toContain(`href="${backHref}"`);
    });

    it('renders pagination for the given base path', function() {
      const html = renderToStaticMarkup(GameDocumentPhotosHelper.render(photos, pagination, basePath, backHref));
      expect(html).toContain(basePath);
    });

    it('does not render an upload button', function() {
      const html = renderToStaticMarkup(GameDocumentPhotosHelper.render(photos, pagination, basePath, backHref));
      expect(html).not.toContain('bi-camera-fill');
    });
  });

  describe('.renderLoading', function() {
    it('renders the loading message', function() {
      const html = renderToStaticMarkup(GameDocumentPhotosHelper.renderLoading());
      expect(html).toContain('container');
    });
  });

  describe('.renderError', function() {
    it('renders the error message', function() {
      const html = renderToStaticMarkup(GameDocumentPhotosHelper.renderError('boom'));
      expect(html).toContain('boom');
    });
  });
});
