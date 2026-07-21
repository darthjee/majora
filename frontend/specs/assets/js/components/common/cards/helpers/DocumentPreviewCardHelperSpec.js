import { renderToStaticMarkup } from 'react-dom/server';
import DocumentPreviewCardHelper
  from '../../../../../../../assets/js/components/common/cards/helpers/DocumentPreviewCardHelper.jsx';

describe('DocumentPreviewCardHelper', function() {
  const document = { id: 1, name: 'Ancient Tome', photo_path: null };

  describe('.render', function() {
    it('renders the grid-cell column classes matching ItemPreviewCard', function() {
      const html = renderToStaticMarkup(DocumentPreviewCardHelper.render(document));
      expect(html).toContain('col-6 col-sm-4 col-md-3 col-lg-2');
    });

    it('renders the default document image when photo_path is null', function() {
      const html = renderToStaticMarkup(DocumentPreviewCardHelper.render(document));
      expect(html).toContain('<img');
      expect(html).toContain('default_document.png');
    });

    it('renders the document image when photo_path is provided', function() {
      const withPhoto = { ...document, photo_path: 'http://example.com/tome.png' };
      const html = renderToStaticMarkup(DocumentPreviewCardHelper.render(withPhoto));
      expect(html).toContain('http://example.com/tome.png');
    });

    it('keeps the document name as the image alt text', function() {
      const html = renderToStaticMarkup(DocumentPreviewCardHelper.render(document));
      expect(html).toContain('alt="Ancient Tome"');
    });

    it('does not render a card body or the document name as visible text', function() {
      const html = renderToStaticMarkup(DocumentPreviewCardHelper.render(document));
      expect(html).not.toContain('card-body');
      expect(html).not.toContain('>Ancient Tome<');
    });

    it('does not render the tooltip content on the initial render', function() {
      const html = renderToStaticMarkup(DocumentPreviewCardHelper.render(document));
      expect(html).not.toContain('>Ancient Tome<');
    });

    it('feeds only the document name to the tooltip content', function() {
      const rendered = DocumentPreviewCardHelper.render(document);
      const tooltip = rendered.props.children;

      expect(tooltip.props.content).toBe('Ancient Tome');
    });
  });
});
