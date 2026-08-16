import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameDocumentEdit from '../../../../../../../assets/js/components/resources/document/pages/GameDocumentEdit.jsx';
import GameDocumentEditHelper
  from '../../../../../../../assets/js/components/resources/document/pages/helpers/GameDocumentEditHelper.jsx';
import PhotoUploadModalHelper
  from '../../../../../../../assets/js/components/common/modals/helpers/PhotoUploadModalHelper.jsx';
import PhotoUploadModalController
  from '../../../../../../../assets/js/components/common/modals/controllers/PhotoUploadModalController.js';
import RequestStore from '../../../../../../../assets/js/utils/requests/RequestStore.js';
import AuthStorage from '../../../../../../../assets/js/utils/auth/AuthStorage.js';
import Noop from '../../../../../../../assets/js/utils/Noop.js';

const loadedDocument = { id: 5, name: 'Ancient Scroll', description: 'A crumbling scroll.', photo_path: '/document.png' };

/** Stub controller that synchronously loads a document (with upload permission) during construction. */
class LoadedController {
  constructor(setDocument, setLoading, setError, setCanUploadPhoto) {
    setDocument(loadedDocument);
    setCanUploadPhoto(true);
    setLoading(false);
  }

  buildEffect() { return () => Noop.noop; }
}

/** Stub controller that stays in the loading state. */
class LoadingController {
  buildEffect() { return () => Noop.noop; }
}

/** Stub controller that synchronously sets an error during construction. */
class ErroredController {
  constructor(setDocument, setLoading, setError) {
    setError('Unable to load document.');
    setLoading(false);
  }

  buildEffect() { return () => Noop.noop; }
}

describe('GameDocumentEdit', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/documents/5/edit' } };
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('renders the loading state while the document is loading', function() {
    const html = renderToStaticMarkup(
      React.createElement(GameDocumentEdit, { ControllerClass: LoadingController }),
    );

    expect(html).toContain('Loading document...');
  });

  it('renders the error state when the document fails to load', function() {
    const html = renderToStaticMarkup(
      React.createElement(GameDocumentEdit, { ControllerClass: ErroredController }),
    );

    expect(html).toContain('Unable to load document.');
  });

  it('delegates to GameDocumentEditHelper.render with the document, back href to the show page and gating', function() {
    let capturedDocument;
    let capturedBackHref;
    let capturedCanUploadPhoto;
    let capturedOnUploadClick;
    let capturedPages;
    spyOn(GameDocumentEditHelper, 'render').and.callFake((document, backHref, canUploadPhoto, onUploadClick, pages) => {
      capturedDocument = document;
      capturedBackHref = backHref;
      capturedCanUploadPhoto = canUploadPhoto;
      capturedOnUploadClick = onUploadClick;
      capturedPages = pages;
      return null;
    });

    renderToStaticMarkup(React.createElement(GameDocumentEdit, { ControllerClass: LoadedController }));

    expect(capturedDocument).toEqual(loadedDocument);
    expect(capturedBackHref).toBe('#/games/demo/documents/5');
    expect(capturedCanUploadPhoto).toBe(true);
    expect(typeof capturedOnUploadClick).toBe('function');
    expect(capturedPages.gameSlug).toBe('demo');
    expect(capturedPages.saveStatus).toBe('idle');
    expect(capturedPages.pagesRef).toEqual(jasmine.objectContaining({ current: null }));
    expect(typeof capturedPages.onSave).toBe('function');
    expect(typeof capturedPages.onRetrySave).toBe('function');
    expect(typeof capturedPages.onSkipSave).toBe('function');
  });

  describe('pages save orchestration (issue #1129)', function() {
    const capturePages = () => {
      let capturedPages;
      spyOn(GameDocumentEditHelper, 'render').and.callFake((document, backHref, canUploadPhoto, onUploadClick, pages) => {
        capturedPages = pages;
        return null;
      });

      renderToStaticMarkup(React.createElement(GameDocumentEdit, { ControllerClass: LoadedController }));

      return capturedPages;
    };

    it('delegates unconditionally to the pages editor\'s imperative save() entry point', async function() {
      const pages = capturePages();
      const saveSpy = jasmine.createSpy('save').and.returnValue(Promise.resolve({ ok: true }));
      pages.pagesRef.current = { save: saveSpy };

      await pages.onSave();

      expect(saveSpy).toHaveBeenCalled();
    });

    it('exposes onRetrySave as the exact same handler as onSave (a retry naturally resumes)', function() {
      const pages = capturePages();

      expect(pages.onRetrySave).toBe(pages.onSave);
    });

    it('does not throw when onSkipSave is invoked', function() {
      const pages = capturePages();

      expect(() => pages.onSkipSave()).not.toThrow();
    });

    it('resolves without throwing when the pages save fails', async function() {
      const pages = capturePages();
      pages.pagesRef.current = { save: jasmine.createSpy('save').and.returnValue(Promise.resolve({ ok: false })) };

      await expectAsync(pages.onSave()).toBeResolved();
    });
  });

  describe('upload modal', function() {
    it('wires the modal to the uploadPath built from the game slug and document id', function() {
      spyOn(GameDocumentEditHelper, 'render').and.returnValue(null);
      spyOn(AuthStorage, 'getToken').and.returnValue('auth-tok');
      spyOn(PhotoUploadModalController.prototype, 'handleSubmit').and.returnValue(Promise.resolve());
      let capturedHandlers;
      spyOn(PhotoUploadModalHelper, 'render').and.callFake((show, state, handlers) => {
        capturedHandlers = handlers;
        return null;
      });

      renderToStaticMarkup(React.createElement(GameDocumentEdit, { ControllerClass: LoadedController }));

      capturedHandlers.onSubmit();

      expect(PhotoUploadModalController.prototype.handleSubmit).toHaveBeenCalledWith(
        '/games/demo/documents/5/photo_upload.json',
        null,
        'auth-tok'
      );
    });

    it('refetches the document via buildEffect when the upload succeeds', function() {
      spyOn(GameDocumentEditHelper, 'render').and.returnValue(null);
      spyOn(AuthStorage, 'getToken').and.returnValue('auth-tok');
      spyOn(PhotoUploadModalController.prototype, 'handleSubmit').and.callFake(function() {
        this.onSuccess();
        return Promise.resolve();
      });
      const buildEffectSpy = spyOn(LoadedController.prototype, 'buildEffect')
        .and.returnValue(() => Noop.noop);
      let capturedHandlers;
      spyOn(PhotoUploadModalHelper, 'render').and.callFake((show, state, handlers) => {
        capturedHandlers = handlers;
        return null;
      });

      renderToStaticMarkup(React.createElement(GameDocumentEdit, { ControllerClass: LoadedController }));

      const callsBefore = buildEffectSpy.calls.count();

      capturedHandlers.onSubmit();

      expect(buildEffectSpy.calls.count()).toBe(callsBefore + 1);
    });

    it('purges the document cache before refetching when the upload succeeds', function() {
      spyOn(GameDocumentEditHelper, 'render').and.returnValue(null);
      spyOn(AuthStorage, 'getToken').and.returnValue('auth-tok');
      spyOn(RequestStore, 'purge');
      spyOn(PhotoUploadModalController.prototype, 'handleSubmit').and.callFake(function() {
        this.onSuccess();
        return Promise.resolve();
      });
      spyOn(LoadedController.prototype, 'buildEffect').and.returnValue(() => Noop.noop);
      let capturedHandlers;
      spyOn(PhotoUploadModalHelper, 'render').and.callFake((show, state, handlers) => {
        capturedHandlers = handlers;
        return null;
      });

      renderToStaticMarkup(React.createElement(GameDocumentEdit, { ControllerClass: LoadedController }));

      capturedHandlers.onSubmit();

      expect(RequestStore.purge).toHaveBeenCalledWith({ resource: 'document' });
    });

    it('closes without refetching when the modal is dismissed', function() {
      spyOn(GameDocumentEditHelper, 'render').and.returnValue(null);
      const buildEffectSpy = spyOn(LoadedController.prototype, 'buildEffect')
        .and.returnValue(() => Noop.noop);
      let capturedHandlers;
      spyOn(PhotoUploadModalHelper, 'render').and.callFake((show, state, handlers) => {
        capturedHandlers = handlers;
        return null;
      });

      renderToStaticMarkup(React.createElement(GameDocumentEdit, { ControllerClass: LoadedController }));

      const callsBefore = buildEffectSpy.calls.count();

      expect(() => {
        capturedHandlers.onClose();
        capturedHandlers.onCancel();
      }).not.toThrow();
      expect(buildEffectSpy.calls.count()).toBe(callsBefore);
    });
  });
});
