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
      const showPageLayout = GameDocumentEditHelper.render(document, '#/games/demo/documents/5', true, onUploadClick);

      expect(showPageLayout.props.context.canUploadPhoto).toBe(true);
      expect(showPageLayout.props.context.handlers.onOpenUploadModal).toBe(onUploadClick);
    });
  });

  describe('pages editor context wiring (issue #1129, folded into ShowPageLayout by #776)', function() {
    // The pages editor, Save button, and failure alert used to render directly here, outside
    // `ShowPageLayout`; they now render through `documentShowType.right`'s `Edit` slot
    // (`DocumentPagesEditSlot`, see its own spec), fed entirely by the context this helper
    // builds — this spec only asserts that wiring reaches the context correctly.
    const document = { id: 5, name: 'Ancient Scroll', description: '' };

    it('folds game_slug, id and canEditPages (from canUploadPhoto) into the context', function() {
      const showPageLayout = GameDocumentEditHelper.render(document, '#/games/demo/documents/5', true, undefined, {
        gameSlug: 'demo',
      });

      expect(showPageLayout.props.context.game_slug).toBe('demo');
      expect(showPageLayout.props.context.id).toBe(5);
      expect(showPageLayout.props.context.canEditPages).toBe(true);
    });

    it('defaults canEditPages to false when canUploadPhoto is false', function() {
      const showPageLayout = GameDocumentEditHelper.render(document, '#/games/demo/documents/5');

      expect(showPageLayout.props.context.canEditPages).toBe(false);
    });

    it('folds the pages ref, save status and save handlers into the context', function() {
      const pagesRef = { current: null };
      const onSave = jasmine.createSpy('onSave');
      const onRetrySave = jasmine.createSpy('onRetrySave');
      const onSkipSave = jasmine.createSpy('onSkipSave');
      const showPageLayout = GameDocumentEditHelper.render(document, '#/games/demo/documents/5', true, undefined, {
        pagesRef, saveStatus: 'failed', onSave, onRetrySave, onSkipSave,
      });

      expect(showPageLayout.props.context.pagesRef).toBe(pagesRef);
      expect(showPageLayout.props.context.saveStatus).toBe('failed');
      expect(showPageLayout.props.context.onSave).toBe(onSave);
      expect(showPageLayout.props.context.onRetrySave).toBe(onRetrySave);
      expect(showPageLayout.props.context.onSkipSave).toBe(onSkipSave);
    });

    it('defaults saveStatus to idle when pages is not given', function() {
      const showPageLayout = GameDocumentEditHelper.render(document, '#/games/demo/documents/5');

      expect(showPageLayout.props.context.saveStatus).toBe('idle');
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
