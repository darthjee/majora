import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameDocument from '../../../../../../../assets/js/components/resources/document/pages/GameDocument.jsx';
import DocumentDetailHelper
  from '../../../../../../../assets/js/components/resources/document/pages/helpers/DocumentDetailHelper.jsx';
import PhotoUploadModalHelper
  from '../../../../../../../assets/js/components/common/modals/helpers/PhotoUploadModalHelper.jsx';
import PhotoUploadModalController
  from '../../../../../../../assets/js/components/common/modals/controllers/PhotoUploadModalController.js';
import RequestStore from '../../../../../../../assets/js/utils/requests/RequestStore.js';
import AuthStorage from '../../../../../../../assets/js/utils/auth/AuthStorage.js';
import Noop from '../../../../../../../assets/js/utils/Noop.js';

const loadedDocument = { id: 5, name: 'Ancient Scroll', description: 'A crumbling scroll.' };

/** Stub controller that synchronously loads a document (with upload permission) during construction. */
class LoadedController {
  constructor(setDocument, setLoading, setError, setCanUploadPhoto) {
    setDocument(loadedDocument);
    setCanUploadPhoto(true);
    setLoading(false);
  }

  buildEffect() { return () => Noop.noop; }
}

/** Stub controller that synchronously loads a document without upload permission. */
class LoadedWithoutUploadController {
  constructor(setDocument, setLoading, setError, setCanUploadPhoto) {
    setDocument(loadedDocument);
    setCanUploadPhoto(false);
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

describe('GameDocument', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/documents/5' } };
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('renders the loading state while the document is loading', function() {
    const html = renderToStaticMarkup(
      React.createElement(GameDocument, { ControllerClass: LoadingController }),
    );

    expect(html).toContain('Loading document...');
  });

  it('renders the error state when the document fails to load', function() {
    const html = renderToStaticMarkup(
      React.createElement(GameDocument, { ControllerClass: ErroredController }),
    );

    expect(html).toContain('Unable to load document.');
  });

  it('delegates to DocumentDetailHelper.render with the document, back href, edit href and gating', function() {
    let capturedDocument;
    let capturedBackHref;
    let capturedEditHref;
    let capturedCanUploadPhoto;
    let capturedOnUploadClick;
    let capturedOnFileUploadClick;
    spyOn(DocumentDetailHelper, 'render').and.callFake(
      (document, backHref, editHref, canUploadPhoto, onUploadClick, onFileUploadClick) => {
        capturedDocument = document;
        capturedBackHref = backHref;
        capturedEditHref = editHref;
        capturedCanUploadPhoto = canUploadPhoto;
        capturedOnUploadClick = onUploadClick;
        capturedOnFileUploadClick = onFileUploadClick;
        return null;
      },
    );

    renderToStaticMarkup(React.createElement(GameDocument, { ControllerClass: LoadedController }));

    expect(capturedDocument).toEqual(loadedDocument);
    expect(capturedBackHref).toBe('#/games/demo/documents');
    expect(capturedEditHref).toBe('#/games/demo/documents/5/edit');
    expect(capturedCanUploadPhoto).toBe(true);
    expect(typeof capturedOnUploadClick).toBe('function');
    expect(typeof capturedOnFileUploadClick).toBe('function');
  });

  it('passes canUploadPhoto=false through when the controller denies it', function() {
    let capturedCanUploadPhoto;
    spyOn(DocumentDetailHelper, 'render').and.callFake((document, backHref, editHref, canUploadPhoto) => {
      capturedCanUploadPhoto = canUploadPhoto;
      return null;
    });

    renderToStaticMarkup(
      React.createElement(GameDocument, { ControllerClass: LoadedWithoutUploadController }),
    );

    expect(capturedCanUploadPhoto).toBe(false);
  });

  it('opens the upload modal via the onUploadClick handler passed to DocumentDetailHelper', function() {
    let capturedOnUploadClick;
    spyOn(DocumentDetailHelper, 'render').and.callFake((document, backHref, editHref, canUploadPhoto, onUploadClick) => {
      capturedOnUploadClick = onUploadClick;
      return null;
    });

    renderToStaticMarkup(React.createElement(GameDocument, { ControllerClass: LoadedController }));

    expect(() => capturedOnUploadClick()).not.toThrow();
  });

  it('opens the file upload modal via the onFileUploadClick handler passed to DocumentDetailHelper', function() {
    let capturedOnFileUploadClick;
    spyOn(DocumentDetailHelper, 'render').and.callFake(
      (document, backHref, editHref, canUploadPhoto, onUploadClick, onFileUploadClick) => {
        capturedOnFileUploadClick = onFileUploadClick;
        return null;
      },
    );

    renderToStaticMarkup(React.createElement(GameDocument, { ControllerClass: LoadedController }));

    expect(() => capturedOnFileUploadClick()).not.toThrow();
  });

  /**
   * `GameDocument` renders two `PhotoUploadModal` instances (photo, then file), so
   * `PhotoUploadModalHelper.render` is called once per instance in JSX order: index `0` is
   * always the photo modal's handlers/state, index `1` the file modal's (issue #726).
   *
   * @param {Function} render - Jasmine spy for `PhotoUploadModalHelper.render`.
   * @returns {{state: object, handlers: object}[]} Captured `(state, handlers)` per call, ordered.
   */
  function captureModalCalls(render) {
    const captured = [];
    render.and.callFake((show, state, handlers) => {
      captured.push({ state, handlers });
      return null;
    });
    return captured;
  }

  describe('upload modal', function() {
    it('wires the modal to the uploadPath built from the game slug and document id', function() {
      spyOn(DocumentDetailHelper, 'render').and.returnValue(null);
      spyOn(AuthStorage, 'getToken').and.returnValue('auth-tok');
      spyOn(PhotoUploadModalController.prototype, 'handleSubmit').and.returnValue(Promise.resolve());
      const captured = captureModalCalls(spyOn(PhotoUploadModalHelper, 'render'));

      renderToStaticMarkup(React.createElement(GameDocument, { ControllerClass: LoadedController }));

      captured[0].handlers.onSubmit();

      expect(PhotoUploadModalController.prototype.handleSubmit).toHaveBeenCalledWith(
        '/games/demo/documents/5/photo_upload.json',
        null,
        'auth-tok'
      );
    });

    it('refetches the document via buildEffect when the upload succeeds', function() {
      spyOn(DocumentDetailHelper, 'render').and.returnValue(null);
      spyOn(AuthStorage, 'getToken').and.returnValue('auth-tok');
      spyOn(PhotoUploadModalController.prototype, 'handleSubmit').and.callFake(function() {
        this.onSuccess();
        return Promise.resolve();
      });
      const buildEffectSpy = spyOn(LoadedController.prototype, 'buildEffect')
        .and.returnValue(() => Noop.noop);
      const captured = captureModalCalls(spyOn(PhotoUploadModalHelper, 'render'));

      renderToStaticMarkup(React.createElement(GameDocument, { ControllerClass: LoadedController }));

      const callsBefore = buildEffectSpy.calls.count();

      captured[0].handlers.onSubmit();

      expect(buildEffectSpy.calls.count()).toBe(callsBefore + 1);
    });

    it('purges the document cache before refetching when the upload succeeds', function() {
      spyOn(DocumentDetailHelper, 'render').and.returnValue(null);
      spyOn(AuthStorage, 'getToken').and.returnValue('auth-tok');
      spyOn(RequestStore, 'purge');
      spyOn(PhotoUploadModalController.prototype, 'handleSubmit').and.callFake(function() {
        this.onSuccess();
        return Promise.resolve();
      });
      spyOn(LoadedController.prototype, 'buildEffect').and.returnValue(() => Noop.noop);
      const captured = captureModalCalls(spyOn(PhotoUploadModalHelper, 'render'));

      renderToStaticMarkup(React.createElement(GameDocument, { ControllerClass: LoadedController }));

      captured[0].handlers.onSubmit();

      expect(RequestStore.purge).toHaveBeenCalledWith({ resource: 'document' });
    });

    it('closes without refetching when the modal is dismissed', function() {
      spyOn(DocumentDetailHelper, 'render').and.returnValue(null);
      const buildEffectSpy = spyOn(LoadedController.prototype, 'buildEffect')
        .and.returnValue(() => Noop.noop);
      const captured = captureModalCalls(spyOn(PhotoUploadModalHelper, 'render'));

      renderToStaticMarkup(React.createElement(GameDocument, { ControllerClass: LoadedController }));

      const callsBefore = buildEffectSpy.calls.count();

      expect(() => {
        captured[0].handlers.onClose();
        captured[0].handlers.onCancel();
      }).not.toThrow();
      expect(buildEffectSpy.calls.count()).toBe(callsBefore);
    });
  });
});
