import { renderToStaticMarkup } from 'react-dom/server';
import CharacterDocumentDetailHelper
  from '../../../../../../../../assets/js/components/resources/character/pages/helpers/CharacterDocumentDetailHelper.jsx';

const renderHelper = (document, backHref = '#/games/demo/pcs/7/documents') => renderToStaticMarkup(
  CharacterDocumentDetailHelper.render(document, backHref, 'demo', 'pcs', 7),
);

describe('CharacterDocumentDetailHelper', function() {
  describe('.render', function() {
    it('renders the document name', function() {
      const document = { id: 5, name: 'Ancient Tome' };
      const html = renderHelper(document);

      expect(html).toContain('Ancient Tome');
    });

    it('renders the document photo', function() {
      const document = { id: 5, name: 'Ancient Tome', photo_path: '/tome.png' };
      const html = renderHelper(document);

      expect(html).toContain('/tome.png');
    });

    it('renders the document description', function() {
      const document = { id: 5, name: 'Ancient Tome', description: 'A dusty old tome.' };
      const html = renderHelper(document);

      expect(html).toContain('A dusty old tome.');
    });

    it('renders a back button to the given href', function() {
      const document = { id: 5, name: 'Ancient Tome' };
      const html = renderHelper(document);

      expect(html).toContain('href="#/games/demo/pcs/7/documents"');
    });

    it('renders the hidden badge when the document is hidden', function() {
      const document = { id: 5, name: 'Ancient Tome', hidden: true };
      const html = renderHelper(document);

      expect(html).toContain('bi-eye-slash-fill');
    });

    it('does not render the hidden badge when the document is not hidden', function() {
      const document = { id: 5, name: 'Ancient Tome' };
      const html = renderHelper(document);

      expect(html).not.toContain('bi-eye-slash-fill');
    });

    it('never renders an upload button or an edit link, since CharacterDocument has nothing to edit', function() {
      const document = { id: 5, name: 'Ancient Tome' };
      const html = renderHelper(document);

      expect(html).not.toContain('actions-overlay-button');
      expect(html).not.toContain('/edit"');
    });

    it('defaults canEditPages to false in the rendering context', function() {
      const document = { id: 5, name: 'Ancient Tome' };
      const element = CharacterDocumentDetailHelper.render(document, '#/games/demo/pcs/7/documents', 'demo', 'pcs', 7);

      expect(element.props.context.canEditPages).toBe(false);
    });

    it('threads the given canEditPages through to the rendering context (issue #1129)', function() {
      const document = { id: 5, name: 'Ancient Tome' };
      const element = CharacterDocumentDetailHelper.render(
        document, '#/games/demo/pcs/7/documents', 'demo', 'pcs', 7, undefined, true,
      );

      expect(element.props.context.canEditPages).toBe(true);
    });

    it('renders the "Edit pages" entry point (redirecting to the underlying GameDocument) when canEditPages is true',
      function() {
        const document = { id: 5, name: 'Ancient Tome', game_document_id: 42 };
        const html = renderToStaticMarkup(
          CharacterDocumentDetailHelper.render(
            document, '#/games/demo/pcs/7/documents', 'demo', 'pcs', 7, undefined, true,
          ),
        );

        expect(html).toContain('href="#/games/demo/documents/42/edit"');
      });
  });

  describe('.renderLoading', function() {
    it('renders the loading message', function() {
      const html = renderToStaticMarkup(CharacterDocumentDetailHelper.renderLoading());
      expect(html).toContain('Loading document...');
    });
  });

  describe('.renderError', function() {
    it('renders the error message', function() {
      const html = renderToStaticMarkup(CharacterDocumentDetailHelper.renderError('boom'));
      expect(html).toContain('boom');
    });
  });
});
