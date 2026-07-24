import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameDocumentNew from '../../../../../../../assets/js/components/resources/document/pages/GameDocumentNew.jsx';
import GameDocumentNewController
  from '../../../../../../../assets/js/components/resources/document/pages/controllers/GameDocumentNewController.js';
import GameDocumentNewHelper
  from '../../../../../../../assets/js/components/resources/document/pages/helpers/GameDocumentNewHelper.jsx';
import { stubBuildEffect } from '../../../../../../support/controllerStubs.js';

describe('GameDocumentNew', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/documents/new' } };
    stubBuildEffect(GameDocumentNewController);
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('renders the document creation form', function() {
    const html = renderToStaticMarkup(React.createElement(GameDocumentNew));

    expect(html).toContain('id="document-new-name"');
    expect(html).toContain('id="document-new-description"');
    expect(html).toContain('id="document-new-hidden"');
  });

  it('renders the submit button', function() {
    const html = renderToStaticMarkup(React.createElement(GameDocumentNew));

    expect(html).toContain('type="submit"');
  });

  it('wires onSubmit to controller.submitForm with the game slug and form fields', function() {
    let capturedHandlers;
    spyOn(GameDocumentNewHelper, 'render').and.callFake((state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });
    spyOn(GameDocumentNewController.prototype, 'submitForm').and.returnValue(Promise.resolve());

    renderToStaticMarkup(React.createElement(GameDocumentNew));
    capturedHandlers.onSubmit();

    expect(GameDocumentNewController.prototype.submitForm).toHaveBeenCalledWith(
      undefined,
      'demo',
      { name: '', description: '', hidden: false },
      jasmine.objectContaining({ setStatus: jasmine.any(Function), setFieldErrors: jasmine.any(Function) }),
    );
  });
});
