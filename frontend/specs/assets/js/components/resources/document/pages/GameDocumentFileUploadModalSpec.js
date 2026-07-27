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

describe('GameDocument file upload modal (issue #726)', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/documents/5' } };
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('wires the modal to the fileUploadPath built from the game slug and document id', function() {
    spyOn(DocumentDetailHelper, 'render').and.returnValue(null);
    spyOn(AuthStorage, 'getToken').and.returnValue('auth-tok');
    spyOn(PhotoUploadModalController.prototype, 'handleSubmit').and.returnValue(Promise.resolve());
    const captured = captureModalCalls(spyOn(PhotoUploadModalHelper, 'render'));

    renderToStaticMarkup(React.createElement(GameDocument, { ControllerClass: LoadedController }));

    captured[1].handlers.onSubmit();

    expect(PhotoUploadModalController.prototype.handleSubmit).toHaveBeenCalledWith(
      '/games/demo/documents/5/file_upload.json',
      null,
      'auth-tok',
      ''
    );
  });

  it('passes translationPrefix="file_upload_modal" and accept=".pdf" to the helper state', function() {
    spyOn(DocumentDetailHelper, 'render').and.returnValue(null);
    const captured = captureModalCalls(spyOn(PhotoUploadModalHelper, 'render'));

    renderToStaticMarkup(React.createElement(GameDocument, { ControllerClass: LoadedController }));

    expect(captured[1].state.translationPrefix).toBe('file_upload_modal');
    expect(captured[1].state.accept).toBe('.pdf');
  });

  it('does not affect the photo modal state', function() {
    spyOn(DocumentDetailHelper, 'render').and.returnValue(null);
    const captured = captureModalCalls(spyOn(PhotoUploadModalHelper, 'render'));

    renderToStaticMarkup(React.createElement(GameDocument, { ControllerClass: LoadedController }));

    expect(captured[0].state.translationPrefix).toBe('photo_upload_modal');
    expect(captured[0].state.accept).toBeUndefined();
    expect(captured[0].state.showNameField).toBe(false);
    expect(captured[0].state.showPhotoField).toBe(false);
  });

  it('passes showNameField={true} to the file modal state only (issue #874)', function() {
    spyOn(DocumentDetailHelper, 'render').and.returnValue(null);
    const captured = captureModalCalls(spyOn(PhotoUploadModalHelper, 'render'));

    renderToStaticMarkup(React.createElement(GameDocument, { ControllerClass: LoadedController }));

    expect(captured[1].state.showNameField).toBe(true);
  });

  it('passes showPhotoField={true} to the file modal state only (issue #878)', function() {
    spyOn(DocumentDetailHelper, 'render').and.returnValue(null);
    const captured = captureModalCalls(spyOn(PhotoUploadModalHelper, 'render'));

    renderToStaticMarkup(React.createElement(GameDocument, { ControllerClass: LoadedController }));

    expect(captured[1].state.showPhotoField).toBe(true);
  });

  it('wires the file modal photo file change handler without throwing (issue #878)', function() {
    spyOn(DocumentDetailHelper, 'render').and.returnValue(null);
    const captured = captureModalCalls(spyOn(PhotoUploadModalHelper, 'render'));

    renderToStaticMarkup(React.createElement(GameDocument, { ControllerClass: LoadedController }));

    expect(() => {
      captured[1].handlers.onPhotoFileChange({ target: { files: [{ name: 'cover.png' }] } });
    }).not.toThrow();
  });

  it('refetches the document via buildEffect when the file upload succeeds', function() {
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

    captured[1].handlers.onSubmit();

    expect(buildEffectSpy.calls.count()).toBe(callsBefore + 1);
  });

  it('purges the document cache before refetching when the file upload succeeds', function() {
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

    captured[1].handlers.onSubmit();

    expect(RequestStore.purge).toHaveBeenCalledWith({ resource: 'document' });
  });

  it('closes without refetching when the file modal is dismissed', function() {
    spyOn(DocumentDetailHelper, 'render').and.returnValue(null);
    const buildEffectSpy = spyOn(LoadedController.prototype, 'buildEffect')
      .and.returnValue(() => Noop.noop);
    const captured = captureModalCalls(spyOn(PhotoUploadModalHelper, 'render'));

    renderToStaticMarkup(React.createElement(GameDocument, { ControllerClass: LoadedController }));

    const callsBefore = buildEffectSpy.calls.count();

    expect(() => {
      captured[1].handlers.onClose();
      captured[1].handlers.onCancel();
    }).not.toThrow();
    expect(buildEffectSpy.calls.count()).toBe(callsBefore);
  });
});
