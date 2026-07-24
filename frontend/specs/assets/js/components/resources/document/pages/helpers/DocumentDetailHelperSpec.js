import { renderToStaticMarkup } from 'react-dom/server';
import DocumentDetailHelper
  from '../../../../../../../../assets/js/components/resources/document/pages/helpers/DocumentDetailHelper.jsx';

describe('DocumentDetailHelper', function() {
  describe('.render', function() {
    it('renders the document name', function() {
      const document = { id: 5, name: 'Ancient Scroll', description: 'A crumbling scroll.' };
      const html = renderToStaticMarkup(DocumentDetailHelper.render(document, '#/games/demo/documents'));

      expect(html).toContain('Ancient Scroll');
    });

    it('renders the document description', function() {
      const document = { id: 5, name: 'Ancient Scroll', description: 'A crumbling scroll.' };
      const html = renderToStaticMarkup(DocumentDetailHelper.render(document, '#/games/demo/documents'));

      expect(html).toContain('A crumbling scroll.');
    });

    it('renders the description inside the collapsible description box', function() {
      const document = { id: 5, name: 'Ancient Scroll', description: 'A crumbling scroll.' };
      const html = renderToStaticMarkup(DocumentDetailHelper.render(document, '#/games/demo/documents'));

      expect(html).toContain('border rounded bg-light');
    });

    it('renders the document photo', function() {
      const document = {
        id: 5, name: 'Ancient Scroll', description: 'A crumbling scroll.', photo_path: '/document.png',
      };
      const html = renderToStaticMarkup(DocumentDetailHelper.render(document, '#/games/demo/documents'));

      expect(html).toContain('/document.png');
    });

    it('renders a back button to the given href', function() {
      const document = { id: 5, name: 'Ancient Scroll', description: '' };
      const html = renderToStaticMarkup(DocumentDetailHelper.render(document, '#/games/demo/documents'));

      expect(html).toContain('href="#/games/demo/documents"');
    });

    it('renders the hidden badge when the document is hidden', function() {
      const document = {
        id: 5, name: 'Ancient Scroll', description: '', hidden: true,
      };
      const html = renderToStaticMarkup(DocumentDetailHelper.render(document, '#/games/demo/documents'));

      expect(html).toContain('bi-eye-slash-fill');
    });

    it('does not render the hidden badge when the document is not hidden', function() {
      const document = { id: 5, name: 'Ancient Scroll', description: '' };
      const html = renderToStaticMarkup(DocumentDetailHelper.render(document, '#/games/demo/documents'));

      expect(html).not.toContain('bi-eye-slash-fill');
    });

    it('does not render an upload button', function() {
      const document = { id: 5, name: 'Ancient Scroll', description: '' };
      const html = renderToStaticMarkup(DocumentDetailHelper.render(document, '#/games/demo/documents'));

      expect(html).not.toContain('actions-overlay-button');
    });
  });

  describe('.renderLoading', function() {
    it('renders the loading message', function() {
      const html = renderToStaticMarkup(DocumentDetailHelper.renderLoading());
      expect(html).toContain('Loading document...');
    });
  });

  describe('.renderError', function() {
    it('renders the error message', function() {
      const html = renderToStaticMarkup(DocumentDetailHelper.renderError('boom'));
      expect(html).toContain('boom');
    });
  });
});
