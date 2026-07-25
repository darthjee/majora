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

    it('does not render the upload button when canUploadPhoto is omitted', function() {
      const document = { id: 5, name: 'Ancient Scroll', description: '' };
      const html = renderToStaticMarkup(
        DocumentDetailHelper.render(document, '#/games/demo/documents', '#/games/demo/documents/5/edit'),
      );

      expect(html).not.toContain('actions-overlay-button');
    });

    it('renders the upload button when canUploadPhoto is true', function() {
      const document = { id: 5, name: 'Ancient Scroll', description: '' };
      const html = renderToStaticMarkup(
        DocumentDetailHelper.render(document, '#/games/demo/documents', '#/games/demo/documents/5/edit', true),
      );

      expect(html).toContain('actions-overlay-button');
    });

    it('passes canUploadPhoto and onUploadClick through to the show page layout context', function() {
      const document = { id: 5, name: 'Ancient Scroll', description: '' };
      const onUploadClick = jasmine.createSpy('onUploadClick');
      const element = DocumentDetailHelper.render(
        document, '#/games/demo/documents', '#/games/demo/documents/5/edit', true, onUploadClick,
      );

      expect(element.props.context.canUploadPhoto).toBe(true);
      expect(element.props.context.handlers.onOpenUploadModal).toBe(onUploadClick);
    });

    it('does not render the edit button when canUploadPhoto is omitted', function() {
      const document = { id: 5, name: 'Ancient Scroll', description: '' };
      const html = renderToStaticMarkup(
        DocumentDetailHelper.render(document, '#/games/demo/documents', '#/games/demo/documents/5/edit'),
      );

      expect(html).not.toContain('href="#/games/demo/documents/5/edit"');
    });

    it('does not render the edit button when canUploadPhoto is false', function() {
      const document = { id: 5, name: 'Ancient Scroll', description: '' };
      const html = renderToStaticMarkup(
        DocumentDetailHelper.render(document, '#/games/demo/documents', '#/games/demo/documents/5/edit', false),
      );

      expect(html).not.toContain('href="#/games/demo/documents/5/edit"');
    });

    it('renders the edit button linking to editHref when canUploadPhoto is true', function() {
      const document = { id: 5, name: 'Ancient Scroll', description: '' };
      const html = renderToStaticMarkup(
        DocumentDetailHelper.render(document, '#/games/demo/documents', '#/games/demo/documents/5/edit', true),
      );

      expect(html).toContain('href="#/games/demo/documents/5/edit"');
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
