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
      const [showPageLayout] = element.props.children;

      expect(showPageLayout.props.context.canUploadPhoto).toBe(true);
      expect(showPageLayout.props.context.handlers.onOpenUploadModal).toBe(onUploadClick);
    });
  });

  describe('pages editor wiring (issue #1129)', function() {
    const document = { id: 5, name: 'Ancient Scroll', description: '' };

    const pagesContainerChildren = (element) => {
      const [, pagesContainer] = element.props.children;

      return pagesContainer.props.children;
    };

    it('renders DocumentPagesEditBox with the ref, gameSlug, document id and canEditPages', function() {
      const pagesRef = { current: null };
      const element = GameDocumentEditHelper.render(document, '#/games/demo/documents/5', true, undefined, {
        gameSlug: 'demo', pagesRef,
      });
      const [pagesEditBox] = pagesContainerChildren(element);

      expect(pagesEditBox.props.ref).toBe(pagesRef);
      expect(pagesEditBox.props.gameSlug).toBe('demo');
      expect(pagesEditBox.props.id).toBe(5);
      expect(pagesEditBox.props.canEditPages).toBe(true);
    });

    it('does not render the Save button when canUploadPhoto is false', function() {
      const element = GameDocumentEditHelper.render(document, '#/games/demo/documents/5', false);
      const [, saveButton] = pagesContainerChildren(element);

      expect(saveButton).toBeNull();
    });

    it('renders an enabled Save button wired to onSave when canUploadPhoto is true', function() {
      const onSave = jasmine.createSpy('onSave');
      const element = GameDocumentEditHelper.render(document, '#/games/demo/documents/5', true, undefined, {
        onSave, saveStatus: 'idle',
      });
      const [, saveButton] = pagesContainerChildren(element);

      expect(saveButton.props.onClick).toBe(onSave);
      expect(saveButton.props.disabled).toBe(false);

      const html = renderToStaticMarkup(element);
      expect(html).toContain('Save');
    });

    it('disables the Save button while saving', function() {
      const element = GameDocumentEditHelper.render(document, '#/games/demo/documents/5', true, undefined, {
        saveStatus: 'saving',
      });
      const [, saveButton] = pagesContainerChildren(element);

      expect(saveButton.props.disabled).toBe(true);
    });

    it('does not render the pages-save-failed alert when saveStatus is not "failed"', function() {
      const element = GameDocumentEditHelper.render(document, '#/games/demo/documents/5', true, undefined, {
        saveStatus: 'idle',
      });
      const [, , failedAlert] = pagesContainerChildren(element);

      expect(failedAlert).toBeNull();
    });

    it('renders the pages-save-failed alert wired to onRetrySave/onSkipSave when saveStatus is "failed"', function() {
      const onRetrySave = jasmine.createSpy('onRetrySave');
      const onSkipSave = jasmine.createSpy('onSkipSave');
      const element = GameDocumentEditHelper.render(document, '#/games/demo/documents/5', true, undefined, {
        saveStatus: 'failed', onRetrySave, onSkipSave,
      });
      const [, , failedAlert] = pagesContainerChildren(element);

      expect(failedAlert.props.onRetry).toBe(onRetrySave);
      expect(failedAlert.props.onSkip).toBe(onSkipSave);
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
