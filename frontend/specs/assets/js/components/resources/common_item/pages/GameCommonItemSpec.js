import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameCommonItem
  from '../../../../../../../assets/js/components/resources/common_item/pages/GameCommonItem.jsx';
import CommonItemDetailHelper
  from '../../../../../../../assets/js/components/resources/common_item/pages/helpers/CommonItemDetailHelper.jsx';
import PhotoUploadModalHelper
  from '../../../../../../../assets/js/components/common/modals/helpers/PhotoUploadModalHelper.jsx';
import PhotoUploadModalController
  from '../../../../../../../assets/js/components/common/modals/controllers/PhotoUploadModalController.js';
import RequestStore from '../../../../../../../assets/js/utils/requests/RequestStore.js';
import AuthStorage from '../../../../../../../assets/js/utils/auth/AuthStorage.js';
import Noop from '../../../../../../../assets/js/utils/Noop.js';

const loadedCommonItem = { id: 5, name: 'Healing Potion', description: 'Heals wounds.', price: 50 };

/** Stub controller that synchronously loads a common item (with upload permission) during construction. */
class LoadedController {
  constructor(setCommonItem, setLoading, setError, setCanEdit, setCanUploadPhoto) {
    setCommonItem(loadedCommonItem);
    setCanEdit(true);
    setCanUploadPhoto(true);
    setLoading(false);
  }

  buildEffect() { return () => Noop.noop; }
}

/** Stub controller that synchronously loads a common item without upload or edit permission. */
class LoadedWithoutUploadController {
  constructor(setCommonItem, setLoading, setError, setCanEdit, setCanUploadPhoto) {
    setCommonItem(loadedCommonItem);
    setCanEdit(false);
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
  constructor(setCommonItem, setLoading, setError) {
    setError('Unable to load common item.');
    setLoading(false);
  }

  buildEffect() { return () => Noop.noop; }
}

describe('GameCommonItem', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/common_items/5' } };
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('renders the loading state while the common item is loading', function() {
    const html = renderToStaticMarkup(
      React.createElement(GameCommonItem, { ControllerClass: LoadingController }),
    );

    expect(html).toContain('Loading common item...');
  });

  it('renders the error state when the common item fails to load', function() {
    const html = renderToStaticMarkup(
      React.createElement(GameCommonItem, { ControllerClass: ErroredController }),
    );

    expect(html).toContain('Unable to load common item.');
  });

  it('delegates to CommonItemDetailHelper.render with the common item, back href, edit href and gating', function() {
    let capturedCommonItem;
    let capturedBackHref;
    let capturedEditHref;
    let capturedCanEdit;
    let capturedCanUploadPhoto;
    let capturedOnUploadClick;
    spyOn(CommonItemDetailHelper, 'render').and.callFake((
      commonItem, backHref, editHref, canEdit, canUploadPhoto, onUploadClick,
    ) => {
      capturedCommonItem = commonItem;
      capturedBackHref = backHref;
      capturedEditHref = editHref;
      capturedCanEdit = canEdit;
      capturedCanUploadPhoto = canUploadPhoto;
      capturedOnUploadClick = onUploadClick;
      return null;
    });

    renderToStaticMarkup(React.createElement(GameCommonItem, { ControllerClass: LoadedController }));

    expect(capturedCommonItem).toEqual(loadedCommonItem);
    expect(capturedBackHref).toBe('#/games/demo/common_items');
    expect(capturedEditHref).toBe('#/games/demo/common_items/5/edit');
    expect(capturedCanEdit).toBe(true);
    expect(capturedCanUploadPhoto).toBe(true);
    expect(typeof capturedOnUploadClick).toBe('function');
  });

  it('passes canEdit=false and canUploadPhoto=false through when the controller denies them', function() {
    let capturedCanEdit;
    let capturedCanUploadPhoto;
    spyOn(CommonItemDetailHelper, 'render').and.callFake((commonItem, backHref, editHref, canEdit, canUploadPhoto) => {
      capturedCanEdit = canEdit;
      capturedCanUploadPhoto = canUploadPhoto;
      return null;
    });

    renderToStaticMarkup(
      React.createElement(GameCommonItem, { ControllerClass: LoadedWithoutUploadController }),
    );

    expect(capturedCanEdit).toBe(false);
    expect(capturedCanUploadPhoto).toBe(false);
  });

  it('opens the upload modal via the onUploadClick handler passed to CommonItemDetailHelper', function() {
    let capturedOnUploadClick;
    spyOn(CommonItemDetailHelper, 'render').and.callFake((
      commonItem, backHref, editHref, canEdit, canUploadPhoto, onUploadClick,
    ) => {
      capturedOnUploadClick = onUploadClick;
      return null;
    });

    renderToStaticMarkup(React.createElement(GameCommonItem, { ControllerClass: LoadedController }));

    expect(() => capturedOnUploadClick()).not.toThrow();
  });

  describe('upload modal', function() {
    it('wires the modal to the uploadPath built from the game slug and common item id', function() {
      spyOn(CommonItemDetailHelper, 'render').and.returnValue(null);
      spyOn(AuthStorage, 'getToken').and.returnValue('auth-tok');
      spyOn(PhotoUploadModalController.prototype, 'handleSubmit').and.returnValue(Promise.resolve());
      let capturedHandlers;
      spyOn(PhotoUploadModalHelper, 'render').and.callFake((show, state, handlers) => {
        capturedHandlers = handlers;
        return null;
      });

      renderToStaticMarkup(React.createElement(GameCommonItem, { ControllerClass: LoadedController }));

      capturedHandlers.onSubmit();

      expect(PhotoUploadModalController.prototype.handleSubmit).toHaveBeenCalledWith(
        '/games/demo/common_items/5/photo_upload.json',
        null,
        'auth-tok'
      );
    });

    it('refetches the common item via buildEffect when the upload succeeds', function() {
      spyOn(CommonItemDetailHelper, 'render').and.returnValue(null);
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

      renderToStaticMarkup(React.createElement(GameCommonItem, { ControllerClass: LoadedController }));

      const callsBefore = buildEffectSpy.calls.count();

      capturedHandlers.onSubmit();

      expect(buildEffectSpy.calls.count()).toBe(callsBefore + 1);
    });

    it('purges the common item cache before refetching when the upload succeeds', function() {
      spyOn(CommonItemDetailHelper, 'render').and.returnValue(null);
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

      renderToStaticMarkup(React.createElement(GameCommonItem, { ControllerClass: LoadedController }));

      capturedHandlers.onSubmit();

      expect(RequestStore.purge).toHaveBeenCalledWith({ resource: 'commonItem' });
    });

    it('closes without refetching when the modal is dismissed', function() {
      spyOn(CommonItemDetailHelper, 'render').and.returnValue(null);
      const buildEffectSpy = spyOn(LoadedController.prototype, 'buildEffect')
        .and.returnValue(() => Noop.noop);
      let capturedHandlers;
      spyOn(PhotoUploadModalHelper, 'render').and.callFake((show, state, handlers) => {
        capturedHandlers = handlers;
        return null;
      });

      renderToStaticMarkup(React.createElement(GameCommonItem, { ControllerClass: LoadedController }));

      const callsBefore = buildEffectSpy.calls.count();

      expect(() => {
        capturedHandlers.onClose();
        capturedHandlers.onCancel();
      }).not.toThrow();
      expect(buildEffectSpy.calls.count()).toBe(callsBefore);
    });
  });
});
