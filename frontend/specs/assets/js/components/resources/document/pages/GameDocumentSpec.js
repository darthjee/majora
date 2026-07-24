import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameDocument from '../../../../../../../assets/js/components/resources/document/pages/GameDocument.jsx';
import DocumentDetailHelper
  from '../../../../../../../assets/js/components/resources/document/pages/helpers/DocumentDetailHelper.jsx';
import Noop from '../../../../../../../assets/js/utils/Noop.js';

const loadedDocument = { id: 5, name: 'Ancient Scroll', description: 'A crumbling scroll.' };

/** Stub controller that synchronously loads a document during construction. */
class LoadedController {
  constructor(setDocument, setLoading) {
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

  it('delegates to DocumentDetailHelper.render with the document and back href', function() {
    let capturedDocument;
    let capturedBackHref;
    spyOn(DocumentDetailHelper, 'render').and.callFake((document, backHref) => {
      capturedDocument = document;
      capturedBackHref = backHref;
      return null;
    });

    renderToStaticMarkup(React.createElement(GameDocument, { ControllerClass: LoadedController }));

    expect(capturedDocument).toEqual(loadedDocument);
    expect(capturedBackHref).toBe('#/games/demo/documents');
  });
});
