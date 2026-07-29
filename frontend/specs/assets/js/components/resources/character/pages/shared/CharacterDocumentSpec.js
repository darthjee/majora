import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import CharacterDocument
  from '../../../../../../../../assets/js/components/resources/character/pages/shared/CharacterDocument.jsx';
import CharacterDocumentDetailController
  from '../../../../../../../../assets/js/components/resources/character/pages/controllers/CharacterDocumentDetailController.js';
import CharacterDocumentDetailHelper
  from '../../../../../../../../assets/js/components/resources/character/pages/helpers/CharacterDocumentDetailHelper.jsx';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';

const loadedDocument = { id: 1, name: 'Ancient Tome' };

/** Stub controller that synchronously loads a document during construction. */
class LoadedController {
  constructor(characterKind, setDocument, setLoading) {
    setDocument(loadedDocument);
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
  constructor(characterKind, setDocument, setLoading, setError) {
    setError('Unable to load document.');
    setLoading(false);
  }

  buildEffect() { return () => Noop.noop; }
}

[
  { label: 'pcs', characterKind: 'pcs', hash: '#/games/demo/pcs/7/documents/1' },
  { label: 'npcs', characterKind: 'npcs', hash: '#/games/demo/npcs/9/documents/1' },
].forEach(({ label, characterKind, hash }) => {
  describe(`CharacterDocument (${label})`, function() {
    let originalWindow;

    beforeEach(function() {
      originalWindow = globalThis.window;
      globalThis.window = { location: { hash } };
    });

    afterEach(function() {
      globalThis.window = originalWindow;
    });

    it('renders the loading state while the document is loading', function() {
      const html = renderToStaticMarkup(
        React.createElement(CharacterDocument, { characterKind, ControllerClass: LoadingController }),
      );

      expect(html).toContain('Loading document...');
    });

    it('renders the error state when the document fails to load', function() {
      const html = renderToStaticMarkup(
        React.createElement(CharacterDocument, { characterKind, ControllerClass: ErroredController }),
      );

      expect(html).toContain('Unable to load document.');
    });

    it('delegates to CharacterDocumentDetailHelper.render with the document and back href', function() {
      let capturedDocument;
      let capturedBackHref;
      spyOn(CharacterDocumentDetailHelper, 'render').and.callFake((document, backHref) => {
        capturedDocument = document;
        capturedBackHref = backHref;
        return null;
      });

      renderToStaticMarkup(
        React.createElement(CharacterDocument, { characterKind, ControllerClass: LoadedController }),
      );

      const { character_id: characterId } = CharacterDocumentDetailController
        .getParamsFromHash(characterKind, hash);

      expect(capturedDocument).toEqual(loadedDocument);
      expect(capturedBackHref).toBe(`#/games/demo/${characterKind}/${characterId}/documents`);
    });
  });
});
