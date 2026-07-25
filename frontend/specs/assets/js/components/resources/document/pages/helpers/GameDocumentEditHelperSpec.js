import { renderToStaticMarkup } from 'react-dom/server';
import GameDocumentEditHelper
  from '../../../../../../../../assets/js/components/resources/document/pages/helpers/GameDocumentEditHelper.jsx';

describe('GameDocumentEditHelper', function() {
  describe('.render', function() {
    it('renders the document name', function() {
      const document = { id: 5, name: 'Ancient Scroll', description: 'A crumbling scroll.' };
      const html = renderToStaticMarkup(GameDocumentEditHelper.render(document, '#/games/demo/documents/5'));

      expect(html).toContain('Ancient Scroll');
    });

    it('renders the document description', function() {
      const document = { id: 5, name: 'Ancient Scroll', description: 'A crumbling scroll.' };
      const html = renderToStaticMarkup(GameDocumentEditHelper.render(document, '#/games/demo/documents/5'));

      expect(html).toContain('A crumbling scroll.');
    });

    it('renders the document photo', function() {
      const document = {
        id: 5, name: 'Ancient Scroll', description: '', photo_path: '/document.png',
      };
      const html = renderToStaticMarkup(GameDocumentEditHelper.render(document, '#/games/demo/documents/5'));

      expect(html).toContain('/document.png');
    });

    it('renders a back button linking to the document show page', function() {
      const document = { id: 5, name: 'Ancient Scroll', description: '' };
      const html = renderToStaticMarkup(GameDocumentEditHelper.render(document, '#/games/demo/documents/5'));

      expect(html).toContain('href="#/games/demo/documents/5"');
    });

    it('always renders the upload button (the edit route is already permission-gated)', function() {
      const document = { id: 5, name: 'Ancient Scroll', description: '' };
      const html = renderToStaticMarkup(
        GameDocumentEditHelper.render(document, '#/games/demo/documents/5', false, jasmine.createSpy('onUploadClick')),
      );

      expect(html).toContain('actions-overlay-button');
    });

    it('passes canUploadPhoto and onUploadClick through to the show page layout context', function() {
      const document = { id: 5, name: 'Ancient Scroll', description: '' };
      const onUploadClick = jasmine.createSpy('onUploadClick');
      const element = GameDocumentEditHelper.render(document, '#/games/demo/documents/5', true, onUploadClick);

      expect(element.props.context.canUploadPhoto).toBe(true);
      expect(element.props.context.handlers.onOpenUploadModal).toBe(onUploadClick);
    });
  });

  describe('.renderLoading', function() {
    it('renders the loading message', function() {
      const html = renderToStaticMarkup(GameDocumentEditHelper.renderLoading());
      expect(html).toContain('Loading document...');
    });
  });

  describe('.renderError', function() {
    it('renders the error message', function() {
      const html = renderToStaticMarkup(GameDocumentEditHelper.renderError('boom'));
      expect(html).toContain('boom');
    });
  });
});
