import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameCommonItemNew
  from '../../../../../../../assets/js/components/resources/common_item/pages/GameCommonItemNew.jsx';
import GameCommonItemNewController
  from '../../../../../../../assets/js/components/resources/common_item/pages/controllers/GameCommonItemNewController.js';
import GameCommonItemNewHelper
  from '../../../../../../../assets/js/components/resources/common_item/pages/helpers/GameCommonItemNewHelper.jsx';
import PhotoUploadModalHelper
  from '../../../../../../../assets/js/components/common/modals/helpers/PhotoUploadModalHelper.jsx';
import MoneyEditModalHelper
  from '../../../../../../../assets/js/components/common/modals/helpers/MoneyEditModalHelper.jsx';
import { stubBuildEffect } from '../../../../../../support/controllerStubs.js';

describe('GameCommonItemNew', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/common_items/new' } };
    stubBuildEffect(GameCommonItemNewController);
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('renders the common item creation form', function() {
    const html = renderToStaticMarkup(React.createElement(GameCommonItemNew));

    expect(html).toContain('id="common-item-new-name"');
    expect(html).toContain('id="common-item-new-description"');
    expect(html).toContain('id="common-item-new-category"');
    expect(html).toContain('id="common-item-new-hidden"');
  });

  it('renders the submit button', function() {
    const html = renderToStaticMarkup(React.createElement(GameCommonItemNew));

    expect(html).toContain('type="submit"');
  });

  it('renders the photo upload modal in deferred mode', function() {
    let capturedState;
    spyOn(PhotoUploadModalHelper, 'render').and.callFake((show, state) => {
      capturedState = state;
      return null;
    });

    renderToStaticMarkup(React.createElement(GameCommonItemNew));

    expect(capturedState.deferred).toBe(true);
  });

  it('opens the upload modal via onOpenUploadModal without throwing', function() {
    let capturedHandlers;
    spyOn(GameCommonItemNewHelper, 'render').and.callFake((state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });

    renderToStaticMarkup(React.createElement(GameCommonItemNew));

    expect(() => capturedHandlers.onOpenUploadModal()).not.toThrow();
  });

  it('wires onRetryPhotoUpload to controller.retryPhotoUpload with the game slug and photo file', function() {
    let capturedHandlers;
    spyOn(GameCommonItemNewHelper, 'render').and.callFake((state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });
    spyOn(GameCommonItemNewController.prototype, 'retryPhotoUpload').and.returnValue(Promise.resolve());

    renderToStaticMarkup(React.createElement(GameCommonItemNew));
    capturedHandlers.onRetryPhotoUpload();

    expect(GameCommonItemNewController.prototype.retryPhotoUpload).toHaveBeenCalledWith(
      'demo',
      null,
      null,
      jasmine.objectContaining({ setStatus: jasmine.any(Function), setGameCommonItemId: jasmine.any(Function) }),
    );
  });

  it('wires onSkipPhotoUpload to redirect to the common items list using the game slug', function() {
    let capturedHandlers;
    spyOn(GameCommonItemNewHelper, 'render').and.callFake((state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });

    renderToStaticMarkup(React.createElement(GameCommonItemNew));
    capturedHandlers.onSkipPhotoUpload();

    expect(globalThis.window.location.hash).toBe('/games/demo/common_items');
  });

  describe('price modal', function() {
    it('renders the price modal initially closed', function() {
      let capturedShow;
      spyOn(MoneyEditModalHelper, 'render').and.callFake((show) => {
        capturedShow = show;
        return null;
      });

      renderToStaticMarkup(React.createElement(GameCommonItemNew));

      expect(capturedShow).toBe(false);
    });

    it('renders the price modal with the treasure context', function() {
      let capturedContext;
      spyOn(MoneyEditModalHelper, 'render').and.callFake((show, state, handlers, context) => {
        capturedContext = context;
        return null;
      });

      renderToStaticMarkup(React.createElement(GameCommonItemNew));

      expect(capturedContext).toBe('treasure');
    });

    it('opens the price modal via onOpenPriceModal without throwing', function() {
      let capturedHandlers;
      spyOn(GameCommonItemNewHelper, 'render').and.callFake((state, handlers) => {
        capturedHandlers = handlers;
        return null;
      });
      spyOn(MoneyEditModalHelper, 'render').and.returnValue(null);

      renderToStaticMarkup(React.createElement(GameCommonItemNew));

      expect(() => capturedHandlers.onOpenPriceModal()).not.toThrow();
    });

    it('does not throw when the price modal is closed or confirmed', function() {
      let capturedMoneyModalHandlers;
      spyOn(MoneyEditModalHelper, 'render').and.callFake((show, state, handlers) => {
        capturedMoneyModalHandlers = handlers;
        return null;
      });

      renderToStaticMarkup(React.createElement(GameCommonItemNew));

      expect(() => {
        capturedMoneyModalHandlers.onClose();
        capturedMoneyModalHandlers.onConfirm(500);
      }).not.toThrow();
    });
  });
});
