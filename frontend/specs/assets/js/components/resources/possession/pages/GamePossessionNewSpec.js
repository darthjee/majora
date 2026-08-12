import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GamePossessionNew
  from '../../../../../../../assets/js/components/resources/possession/pages/GamePossessionNew.jsx';
import GamePossessionNewController
  from '../../../../../../../assets/js/components/resources/possession/pages/controllers/GamePossessionNewController.js';
import GamePossessionNewHelper
  from '../../../../../../../assets/js/components/resources/possession/pages/helpers/GamePossessionNewHelper.jsx';
import PhotoUploadModalHelper
  from '../../../../../../../assets/js/components/common/modals/helpers/PhotoUploadModalHelper.jsx';
import { stubBuildEffect } from '../../../../../../support/controllerStubs.js';

describe('GamePossessionNew', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/possessions/new' } };
    stubBuildEffect(GamePossessionNewController);
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('renders the possession creation form', function() {
    const html = renderToStaticMarkup(React.createElement(GamePossessionNew));

    expect(html).toContain('id="possession-new-name"');
    expect(html).toContain('id="possession-new-description"');
    expect(html).toContain('id="possession-new-hidden"');
  });

  it('renders the submit button', function() {
    const html = renderToStaticMarkup(React.createElement(GamePossessionNew));

    expect(html).toContain('type="submit"');
  });

  it('renders the photo upload modal in deferred mode', function() {
    let capturedState;
    spyOn(PhotoUploadModalHelper, 'render').and.callFake((show, state) => {
      capturedState = state;
      return null;
    });

    renderToStaticMarkup(React.createElement(GamePossessionNew));

    expect(capturedState.deferred).toBe(true);
  });

  it('opens the upload modal via onOpenUploadModal without throwing', function() {
    let capturedHandlers;
    spyOn(GamePossessionNewHelper, 'render').and.callFake((state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });

    renderToStaticMarkup(React.createElement(GamePossessionNew));

    expect(() => capturedHandlers.onOpenUploadModal()).not.toThrow();
  });

  it('wires onRetryPhotoUpload to controller.retryPhotoUpload with the game slug and photo file', function() {
    let capturedHandlers;
    spyOn(GamePossessionNewHelper, 'render').and.callFake((state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });
    spyOn(GamePossessionNewController.prototype, 'retryPhotoUpload').and.returnValue(Promise.resolve());

    renderToStaticMarkup(React.createElement(GamePossessionNew));
    capturedHandlers.onRetryPhotoUpload();

    expect(GamePossessionNewController.prototype.retryPhotoUpload).toHaveBeenCalledWith(
      'demo',
      null,
      null,
      jasmine.objectContaining({ setStatus: jasmine.any(Function), setGamePossessionId: jasmine.any(Function) }),
    );
  });

  it('wires onSkipPhotoUpload to redirect to the possessions list using the game slug', function() {
    let capturedHandlers;
    spyOn(GamePossessionNewHelper, 'render').and.callFake((state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });

    renderToStaticMarkup(React.createElement(GamePossessionNew));
    capturedHandlers.onSkipPhotoUpload();

    expect(globalThis.window.location.hash).toBe('/games/demo/possessions');
  });
});
