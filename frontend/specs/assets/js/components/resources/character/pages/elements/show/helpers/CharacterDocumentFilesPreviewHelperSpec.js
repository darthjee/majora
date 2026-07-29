import { renderToStaticMarkup } from 'react-dom/server';
import CharacterDocumentFilesPreviewHelper
  from '../../../../../../../../../../assets/js/components/resources/character/pages/elements/show/helpers/CharacterDocumentFilesPreviewHelper.jsx';

describe('CharacterDocumentFilesPreviewHelper', function() {
  const title = 'Files';

  const buildFiles = (count) => Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    character_document_id: 9,
    name: `File ${index + 1}`,
    path: `/files/${index + 1}/download`,
    photo_path: null,
  }));

  describe('.render', function() {
    it('renders the title as a heading', function() {
      const html = renderToStaticMarkup(CharacterDocumentFilesPreviewHelper.render(buildFiles(2), title));
      expect(html).toContain('Files');
    });

    it('renders a card for each file, linking to its download path', function() {
      const html = renderToStaticMarkup(CharacterDocumentFilesPreviewHelper.render(buildFiles(2), title));
      expect(html).toContain('href="/files/1/download"');
      expect(html).toContain('href="/files/2/download"');
    });

    it('renders no "see all" link, since no full-list page exists for a CharacterDocument\'s files', function() {
      const html = renderToStaticMarkup(CharacterDocumentFilesPreviewHelper.render(buildFiles(1), title));
      expect(html).not.toContain('bi-files');
    });

    it('renders an empty-state message when there are no files', function() {
      const html = renderToStaticMarkup(CharacterDocumentFilesPreviewHelper.render([], title));
      expect(html).toContain('Files');
      expect(html).not.toContain('card');
    });
  });
});
