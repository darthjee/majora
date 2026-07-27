import { renderToStaticMarkup } from 'react-dom/server';
import GameDocumentFilesHelper
  from '../../../../../../../../assets/js/components/resources/document/pages/helpers/GameDocumentFilesHelper.jsx';

describe('GameDocumentFilesHelper', function() {
  const files = [
    { id: 1, name: 'Notes', path: '/files/1/download', photo_path: null },
    { id: 2, name: 'Map', path: '/files/2/download', photo_path: null },
  ];
  const pagination = { page: 1, pages: 2, perPage: 10 };
  const basePath = '#/games/demo/documents/9/files';
  const backHref = '#/games/demo/documents/9';

  describe('.render', function() {
    it('renders a card for each file, linking to its download path', function() {
      const html = renderToStaticMarkup(GameDocumentFilesHelper.render(files, pagination, basePath, backHref));
      expect(html).toContain('href="/files/1/download"');
      expect(html).toContain('href="/files/2/download"');
    });

    it('renders a back button to the document detail page', function() {
      const html = renderToStaticMarkup(GameDocumentFilesHelper.render(files, pagination, basePath, backHref));
      expect(html).toContain(`href="${backHref}"`);
    });

    it('renders pagination for the given base path', function() {
      const html = renderToStaticMarkup(GameDocumentFilesHelper.render(files, pagination, basePath, backHref));
      expect(html).toContain(basePath);
    });
  });

  describe('.renderLoading', function() {
    it('renders the loading message', function() {
      const html = renderToStaticMarkup(GameDocumentFilesHelper.renderLoading());
      expect(html).toContain('container');
    });
  });

  describe('.renderError', function() {
    it('renders the error message', function() {
      const html = renderToStaticMarkup(GameDocumentFilesHelper.renderError('boom'));
      expect(html).toContain('boom');
    });
  });
});
