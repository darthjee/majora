import { renderToStaticMarkup } from 'react-dom/server';
import DocumentFilesPreviewHelper
  from '../../../../../../../../../../assets/js/components/resources/document/pages/elements/show/helpers/DocumentFilesPreviewHelper.jsx';

describe('DocumentFilesPreviewHelper', function() {
  const title = 'Files';
  const seeAllHref = '#/games/epic-quest/documents/9/files';

  const buildFiles = (count) => Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    name: `File ${index + 1}`,
    path: `/files/${index + 1}/download`,
    photo_path: null,
  }));

  describe('.render', function() {
    it('renders the title as a heading', function() {
      const html = renderToStaticMarkup(DocumentFilesPreviewHelper.render(buildFiles(2), title, seeAllHref));
      expect(html).toContain('Files');
    });

    it('renders a card for each file, linking to its download path', function() {
      const html = renderToStaticMarkup(DocumentFilesPreviewHelper.render(buildFiles(2), title, seeAllHref));
      expect(html).toContain('href="/files/1/download"');
      expect(html).toContain('href="/files/2/download"');
    });

    it('renders a see all card with the provided href and files icon', function() {
      const html = renderToStaticMarkup(DocumentFilesPreviewHelper.render(buildFiles(1), title, seeAllHref));
      expect(html).toContain(`href="${seeAllHref}"`);
      expect(html).toContain('bi-files');
    });

    it('renders an empty-state message and keeps the see all link when there are no files', function() {
      const html = renderToStaticMarkup(DocumentFilesPreviewHelper.render([], title, seeAllHref));
      expect(html).toContain('Files');
      expect(html).toContain(`href="${seeAllHref}"`);
    });
  });
});
