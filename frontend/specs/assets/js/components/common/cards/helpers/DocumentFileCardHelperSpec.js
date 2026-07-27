import { renderToStaticMarkup } from 'react-dom/server';
import DocumentFileCardHelper
  from '../../../../../../../assets/js/components/common/cards/helpers/DocumentFileCardHelper.jsx';

describe('DocumentFileCardHelper', function() {
  const file = {
    id: 1, name: 'Campaign Notes', path: '/files/1/download', photo_path: null,
  };

  describe('.render', function() {
    it('renders the grid-cell column classes matching ItemPreviewCard', function() {
      const html = renderToStaticMarkup(DocumentFileCardHelper.render(file));
      expect(html).toContain('col-6 col-sm-4 col-md-3 col-lg-2');
    });

    it('renders the default file image when photo_path is null', function() {
      const html = renderToStaticMarkup(DocumentFileCardHelper.render(file));
      expect(html).toContain('<img');
      expect(html).toContain('default_file.png');
    });

    it('renders the file photo when photo_path is provided', function() {
      const withPhoto = { ...file, photo_path: 'http://example.com/notes.png' };
      const html = renderToStaticMarkup(DocumentFileCardHelper.render(withPhoto));
      expect(html).toContain('http://example.com/notes.png');
    });

    it('keeps the file name as the image alt text', function() {
      const html = renderToStaticMarkup(DocumentFileCardHelper.render(file));
      expect(html).toContain('alt="Campaign Notes"');
    });

    it('does not render the tooltip content on the initial render', function() {
      const html = renderToStaticMarkup(DocumentFileCardHelper.render(file));
      expect(html).not.toContain('>Campaign Notes<');
    });

    it('feeds only the file name to the tooltip content', function() {
      const rendered = DocumentFileCardHelper.render(file);
      const tooltip = rendered.props.children;

      expect(tooltip.props.content).toBe('Campaign Notes');
    });

    it('links the whole card to the file path, with the download attribute', function() {
      const html = renderToStaticMarkup(DocumentFileCardHelper.render(file));
      expect(html).toContain('href="/files/1/download"');
      expect(html).toContain('download=""');
    });
  });
});
