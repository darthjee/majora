import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameItem from '../../../../../../../assets/js/components/resources/item/pages/GameItem.jsx';
import ItemDetailHelper from '../../../../../../../assets/js/components/resources/item/pages/helpers/ItemDetailHelper.jsx';
import PhotoUploadModalHelper
  from '../../../../../../../assets/js/components/common/modals/helpers/PhotoUploadModalHelper.jsx';
import PhotoUploadModalController
  from '../../../../../../../assets/js/components/common/modals/controllers/PhotoUploadModalController.js';
import AuthStorage from '../../../../../../../assets/js/utils/auth/AuthStorage.js';
import Noop from '../../../../../../../assets/js/utils/Noop.js';

const loadedItem = { id: 5, name: 'Cloak of Elvenkind', description: 'A shimmering cloak.' };

/** Stub controller that synchronously loads an item (with upload permission) during construction. */
class LoadedController {
  constructor(setItem, setLoading, setError, setCanEdit, setCanUploadPhoto) {
    setItem(loadedItem);
    setCanEdit(true);
    setCanUploadPhoto(true);
    setLoading(false);
  }

  buildEffect() { return () => Noop.noop; }
}

/** Stub controller that synchronously loads an item without upload or edit permission. */
class LoadedWithoutUploadController {
  constructor(setItem, setLoading, setError, setCanEdit, setCanUploadPhoto) {
    setItem(loadedItem);
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
  constructor(setItem, setLoading, setError) {
    setError('Unable to load item.');
    setLoading(false);
  }

  buildEffect() { return () => Noop.noop; }
}

describe('GameItem', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/items/5' } };
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('renders the loading state while the item is loading', function() {
    const html = renderToStaticMarkup(
      React.createElement(GameItem, { ControllerClass: LoadingController }),
    );

    expect(html).toContain('Loading item...');
  });

  it('renders the error state when the item fails to load', function() {
    const html = renderToStaticMarkup(
      React.createElement(GameItem, { ControllerClass: ErroredController }),
    );

    expect(html).toContain('Unable to load item.');
  });

  it('delegates to ItemDetailHelper.render with the item, back href, edit href and gating', function() {
    let capturedItem;
    let capturedBackHref;
    let capturedEditHref;
    let capturedCanEdit;
    let capturedCanUploadPhoto;
    let capturedOnUploadClick;
    spyOn(ItemDetailHelper, 'render').and.callFake((item, backHref, editHref, canEdit, canUploadPhoto, onUploadClick) => {
      capturedItem = item;
      capturedBackHref = backHref;
      capturedEditHref = editHref;
      capturedCanEdit = canEdit;
      capturedCanUploadPhoto = canUploadPhoto;
      capturedOnUploadClick = onUploadClick;
      return null;
    });

    renderToStaticMarkup(React.createElement(GameItem, { ControllerClass: LoadedController }));

    expect(capturedItem).toEqual(loadedItem);
    expect(capturedBackHref).toBe('#/games/demo/items');
    expect(capturedEditHref).toBe('#/games/demo/items/5/edit');
    expect(capturedCanEdit).toBe(true);
    expect(capturedCanUploadPhoto).toBe(true);
    expect(typeof capturedOnUploadClick).toBe('function');
  });

  it('passes canEdit=false and canUploadPhoto=false through when the controller denies them', function() {
    let capturedCanEdit;
    let capturedCanUploadPhoto;
    spyOn(ItemDetailHelper, 'render').and.callFake((item, backHref, editHref, canEdit, canUploadPhoto) => {
      capturedCanEdit = canEdit;
      capturedCanUploadPhoto = canUploadPhoto;
      return null;
    });

    renderToStaticMarkup(
      React.createElement(GameItem, { ControllerClass: LoadedWithoutUploadController }),
    );

    expect(capturedCanEdit).toBe(false);
    expect(capturedCanUploadPhoto).toBe(false);
  });

  it('opens the upload modal via the onUploadClick handler passed to ItemDetailHelper', function() {
    let capturedOnUploadClick;
    spyOn(ItemDetailHelper, 'render').and.callFake((item, backHref, editHref, canEdit, canUploadPhoto, onUploadClick) => {
      capturedOnUploadClick = onUploadClick;
      return null;
    });

    renderToStaticMarkup(React.createElement(GameItem, { ControllerClass: LoadedController }));

    expect(() => capturedOnUploadClick()).not.toThrow();
  });

  describe('upload modal', function() {
    it('wires the modal to the uploadPath built from the game slug and item id', function() {
      spyOn(ItemDetailHelper, 'render').and.returnValue(null);
      spyOn(AuthStorage, 'getToken').and.returnValue('auth-tok');
      spyOn(PhotoUploadModalController.prototype, 'handleSubmit').and.returnValue(Promise.resolve());
      let capturedHandlers;
      spyOn(PhotoUploadModalHelper, 'render').and.callFake((show, state, handlers) => {
        capturedHandlers = handlers;
        return null;
      });

      renderToStaticMarkup(React.createElement(GameItem, { ControllerClass: LoadedController }));

      capturedHandlers.onSubmit();

      expect(PhotoUploadModalController.prototype.handleSubmit).toHaveBeenCalledWith(
        '/games/demo/items/5/photo_upload.json',
        null,
        'auth-tok'
      );
    });

    it('refetches the item via buildEffect when the upload succeeds', function() {
      spyOn(ItemDetailHelper, 'render').and.returnValue(null);
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

      renderToStaticMarkup(React.createElement(GameItem, { ControllerClass: LoadedController }));

      const callsBefore = buildEffectSpy.calls.count();

      capturedHandlers.onSubmit();

      expect(buildEffectSpy.calls.count()).toBe(callsBefore + 1);
    });

    it('closes without refetching when the modal is dismissed', function() {
      spyOn(ItemDetailHelper, 'render').and.returnValue(null);
      const buildEffectSpy = spyOn(LoadedController.prototype, 'buildEffect')
        .and.returnValue(() => Noop.noop);
      let capturedHandlers;
      spyOn(PhotoUploadModalHelper, 'render').and.callFake((show, state, handlers) => {
        capturedHandlers = handlers;
        return null;
      });

      renderToStaticMarkup(React.createElement(GameItem, { ControllerClass: LoadedController }));

      const callsBefore = buildEffectSpy.calls.count();

      expect(() => {
        capturedHandlers.onClose();
        capturedHandlers.onCancel();
      }).not.toThrow();
      expect(buildEffectSpy.calls.count()).toBe(callsBefore);
    });
  });
});
