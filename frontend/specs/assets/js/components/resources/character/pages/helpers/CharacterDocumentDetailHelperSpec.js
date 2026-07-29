import { renderToStaticMarkup } from 'react-dom/server';
import CharacterDocumentDetailHelper
  from '../../../../../../../../assets/js/components/resources/character/pages/helpers/CharacterDocumentDetailHelper.jsx';

describe('CharacterDocumentDetailHelper', function() {
  describe('.render', function() {
    it('renders the document name', function() {
      const document = { id: 5, name: 'Ancient Tome' };
      const html = renderToStaticMarkup(CharacterDocumentDetailHelper.render(document, '#/games/demo/pcs/7/documents'));

      expect(html).toContain('Ancient Tome');
    });

    it('renders the document photo', function() {
      const document = { id: 5, name: 'Ancient Tome', photo_path: '/tome.png' };
      const html = renderToStaticMarkup(CharacterDocumentDetailHelper.render(document, '#/games/demo/pcs/7/documents'));

      expect(html).toContain('/tome.png');
    });

    it('renders a back button to the given href', function() {
      const document = { id: 5, name: 'Ancient Tome' };
      const html = renderToStaticMarkup(CharacterDocumentDetailHelper.render(document, '#/games/demo/pcs/7/documents'));

      expect(html).toContain('href="#/games/demo/pcs/7/documents"');
    });

    it('renders the hidden badge when the document is hidden', function() {
      const document = { id: 5, name: 'Ancient Tome', hidden: true };
      const html = renderToStaticMarkup(CharacterDocumentDetailHelper.render(document, '#/games/demo/pcs/7/documents'));

      expect(html).toContain('bi-eye-slash-fill');
    });

    it('does not render the hidden badge when the document is not hidden', function() {
      const document = { id: 5, name: 'Ancient Tome' };
      const html = renderToStaticMarkup(CharacterDocumentDetailHelper.render(document, '#/games/demo/pcs/7/documents'));

      expect(html).not.toContain('bi-eye-slash-fill');
    });

    it('never renders an upload button or an edit link, since CharacterDocument has nothing to edit', function() {
      const document = { id: 5, name: 'Ancient Tome' };
      const html = renderToStaticMarkup(CharacterDocumentDetailHelper.render(document, '#/games/demo/pcs/7/documents'));

      expect(html).not.toContain('actions-overlay-button');
      expect(html).not.toContain('/edit"');
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
