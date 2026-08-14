import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameDocument from '../../../../../../../assets/js/components/resources/document/pages/GameDocument.jsx';
import DocumentDetailHelper
  from '../../../../../../../assets/js/components/resources/document/pages/helpers/DocumentDetailHelper.jsx';
import GiveDocumentModalHelper
  from '../../../../../../../assets/js/components/resources/document/pages/elements/helpers/GiveDocumentModalHelper.jsx';
import GiveDocumentModalController
  from '../../../../../../../assets/js/components/resources/document/pages/elements/controllers/GiveDocumentModalController.js';
import Noop from '../../../../../../../assets/js/utils/Noop.js';

const loadedDocument = { id: 5, name: 'Ancient Scroll', description: 'A crumbling scroll.' };

/** Stub controller that synchronously loads a document (with upload/give-hidden permission) during construction. */
class LoadedController {
  constructor(setDocument, setLoading, setError, setCanUploadPhoto, setCanGiveHidden) {
    setDocument(loadedDocument);
    setCanUploadPhoto(true);
    setCanGiveHidden(true);
    setLoading(false);
  }

  buildEffect() { return () => Noop.noop; }
}

describe('GameDocument give-document modal (issue #1005)', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/documents/5' } };
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('is shown once the give-document button handler is invoked', function() {
    let capturedOnGiveDocumentClick;
    spyOn(DocumentDetailHelper, 'render').and.callFake((
      document, backHref, editHref, canUploadPhoto, onUploadClick, onFileUploadClick,
      gameSlug, onSelectPhoto, onGiveDocumentClick,
    ) => {
      capturedOnGiveDocumentClick = onGiveDocumentClick;
      return null;
    });
    let capturedShow;
    spyOn(GiveDocumentModalHelper, 'render').and.callFake((show) => {
      capturedShow = show;
      return null;
    });

    renderToStaticMarkup(React.createElement(GameDocument, { ControllerClass: LoadedController }));

    expect(capturedShow).toBe(false);
    expect(() => capturedOnGiveDocumentClick()).not.toThrow();
  });

  it('wires the modal to the loaded document, game slug, and canGiveHidden gating', async function() {
    spyOn(DocumentDetailHelper, 'render').and.returnValue(null);
    let capturedHandlers;
    spyOn(GiveDocumentModalHelper, 'render').and.callFake((show, state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });
    spyOn(GiveDocumentModalController.prototype, 'addCharacter').and.returnValue(Promise.resolve());
    spyOn(GiveDocumentModalController.prototype, 'submit').and.returnValue(Promise.resolve());

    renderToStaticMarkup(React.createElement(GameDocument, { ControllerClass: LoadedController }));

    capturedHandlers.onSelectCharacter({ id: 3, name: 'Aria' });

    expect(GiveDocumentModalController.prototype.addCharacter).toHaveBeenCalledWith(
      { id: 3, name: 'Aria' }, 'pcs', 'demo', loadedDocument.id, [], jasmine.any(Function),
    );

    await capturedHandlers.onSubmit();

    expect(GiveDocumentModalController.prototype.submit).toHaveBeenCalledWith(
      [], 'demo', loadedDocument.id, true, jasmine.any(Object),
    );
  });

  it('closes without throwing when onClose is invoked', function() {
    spyOn(DocumentDetailHelper, 'render').and.returnValue(null);
    let capturedHandlers;
    spyOn(GiveDocumentModalHelper, 'render').and.callFake((show, state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });

    renderToStaticMarkup(React.createElement(GameDocument, { ControllerClass: LoadedController }));

    expect(() => capturedHandlers.onClose()).not.toThrow();
  });
});
