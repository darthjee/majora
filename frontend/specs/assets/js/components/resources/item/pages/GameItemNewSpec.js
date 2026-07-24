import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameItemNew from '../../../../../../../assets/js/components/resources/item/pages/GameItemNew.jsx';
import GameItemNewController
  from '../../../../../../../assets/js/components/resources/item/pages/controllers/GameItemNewController.js';
import GameItemNewHelper
  from '../../../../../../../assets/js/components/resources/item/pages/helpers/GameItemNewHelper.jsx';
import PhotoUploadModalHelper
  from '../../../../../../../assets/js/components/common/modals/helpers/PhotoUploadModalHelper.jsx';
import { stubBuildEffect } from '../../../../../../support/controllerStubs.js';

describe('GameItemNew', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/items/new' } };
    stubBuildEffect(GameItemNewController);
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('renders the item creation form', function() {
    const html = renderToStaticMarkup(React.createElement(GameItemNew));

    expect(html).toContain('id="item-new-name"');
    expect(html).toContain('id="item-new-description"');
    expect(html).toContain('id="item-new-hidden"');
  });

  it('renders the submit button', function() {
    const html = renderToStaticMarkup(React.createElement(GameItemNew));

    expect(html).toContain('type="submit"');
  });

  it('renders the photo upload modal in deferred mode', function() {
    let capturedState;
    spyOn(PhotoUploadModalHelper, 'render').and.callFake((show, state) => {
      capturedState = state;
      return null;
    });

    renderToStaticMarkup(React.createElement(GameItemNew));

    expect(capturedState.deferred).toBe(true);
  });

  it('opens the upload modal via onOpenUploadModal without throwing', function() {
    let capturedHandlers;
    spyOn(GameItemNewHelper, 'render').and.callFake((state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });

    renderToStaticMarkup(React.createElement(GameItemNew));

    expect(() => capturedHandlers.onOpenUploadModal()).not.toThrow();
  });

  it('wires onRetryPhotoUpload to controller.retryPhotoUpload with the game slug and photo file', function() {
    let capturedHandlers;
    spyOn(GameItemNewHelper, 'render').and.callFake((state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });
    spyOn(GameItemNewController.prototype, 'retryPhotoUpload').and.returnValue(Promise.resolve());

    renderToStaticMarkup(React.createElement(GameItemNew));
    capturedHandlers.onRetryPhotoUpload();

    expect(GameItemNewController.prototype.retryPhotoUpload).toHaveBeenCalledWith(
      'demo',
      null,
      null,
      jasmine.objectContaining({ setStatus: jasmine.any(Function), setGameItemId: jasmine.any(Function) }),
    );
  });

  it('wires onSkipPhotoUpload to redirect to the items list using the game slug', function() {
    let capturedHandlers;
    spyOn(GameItemNewHelper, 'render').and.callFake((state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });

    renderToStaticMarkup(React.createElement(GameItemNew));
    capturedHandlers.onSkipPhotoUpload();

    expect(globalThis.window.location.hash).toBe('/games/demo/items');
  });
});
