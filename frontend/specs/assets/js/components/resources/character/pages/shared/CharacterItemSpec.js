import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import CharacterItem
  from '../../../../../../../../assets/js/components/resources/character/pages/shared/CharacterItem.jsx';
import CharacterItemDetailController
  from '../../../../../../../../assets/js/components/resources/character/pages/controllers/CharacterItemDetailController.js';
import ItemDetailHelper
  from '../../../../../../../../assets/js/components/resources/item/pages/helpers/ItemDetailHelper.jsx';
import PhotoUploadModalHelper
  from '../../../../../../../../assets/js/components/common/modals/helpers/PhotoUploadModalHelper.jsx';
import PhotoUploadModalController
  from '../../../../../../../../assets/js/components/common/modals/controllers/PhotoUploadModalController.js';
import AuthStorage from '../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';

const loadedItem = { id: 1, name: 'Cloak of Elvenkind', description: 'A shimmering cloak.' };

/** Stub controller that synchronously loads an item (with upload permission) during construction. */
class LoadedController {
  constructor(characterKind, setItem, setLoading, setError, setCanUploadPhoto) {
    setItem(loadedItem);
    setCanUploadPhoto(true);
    setLoading(false);
  }

  buildEffect() { return () => Noop.noop; }
}

/** Stub controller that synchronously loads an item without upload permission. */
class LoadedWithoutUploadController {
  constructor(characterKind, setItem, setLoading, setError, setCanUploadPhoto) {
    setItem(loadedItem);
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
  constructor(characterKind, setItem, setLoading, setError) {
    setError('Unable to load item.');
    setLoading(false);
  }

  buildEffect() { return () => Noop.noop; }
}

[
  { label: 'pcs', characterKind: 'pcs', hash: '#/games/demo/pcs/7/items/1' },
  { label: 'npcs', characterKind: 'npcs', hash: '#/games/demo/npcs/9/items/1' },
].forEach(({ label, characterKind, hash }) => {
  describe(`CharacterItem (${label})`, function() {
    let originalWindow;

    beforeEach(function() {
      originalWindow = globalThis.window;
      globalThis.window = { location: { hash } };
    });

    afterEach(function() {
      globalThis.window = originalWindow;
    });

    it('renders the loading state while the item is loading', function() {
      const html = renderToStaticMarkup(
        React.createElement(CharacterItem, { characterKind, ControllerClass: LoadingController }),
      );

      expect(html).toContain('Loading item...');
    });

    it('renders the error state when the item fails to load', function() {
      const html = renderToStaticMarkup(
        React.createElement(CharacterItem, { characterKind, ControllerClass: ErroredController }),
      );

      expect(html).toContain('Unable to load item.');
    });

    it('delegates to ItemDetailHelper.render with the item, back href and upload gating', function() {
      let capturedItem;
      let capturedBackHref;
      let capturedCanUploadPhoto;
      let capturedOnUploadClick;
      spyOn(ItemDetailHelper, 'render').and.callFake((item, backHref, canUploadPhoto, onUploadClick) => {
        capturedItem = item;
        capturedBackHref = backHref;
        capturedCanUploadPhoto = canUploadPhoto;
        capturedOnUploadClick = onUploadClick;
        return null;
      });

      renderToStaticMarkup(
        React.createElement(CharacterItem, { characterKind, ControllerClass: LoadedController }),
      );

      expect(capturedItem).toEqual(loadedItem);
      expect(capturedBackHref).toBe(hash.replace(/\/1$/, ''));
      expect(capturedCanUploadPhoto).toBe(true);
      expect(typeof capturedOnUploadClick).toBe('function');
    });

    it('passes canUploadPhoto=false through when the controller denies it', function() {
      let capturedCanUploadPhoto;
      spyOn(ItemDetailHelper, 'render').and.callFake((item, backHref, canUploadPhoto) => {
        capturedCanUploadPhoto = canUploadPhoto;
        return null;
      });

      renderToStaticMarkup(
        React.createElement(CharacterItem, { characterKind, ControllerClass: LoadedWithoutUploadController }),
      );

      expect(capturedCanUploadPhoto).toBe(false);
    });

    it('opens the upload modal via the onUploadClick handler passed to ItemDetailHelper', function() {
      let capturedOnUploadClick;
      spyOn(ItemDetailHelper, 'render').and.callFake((item, backHref, canUploadPhoto, onUploadClick) => {
        capturedOnUploadClick = onUploadClick;
        return null;
      });

      renderToStaticMarkup(
        React.createElement(CharacterItem, { characterKind, ControllerClass: LoadedController }),
      );

      expect(() => capturedOnUploadClick()).not.toThrow();
    });

    describe('upload modal', function() {
      it('wires the modal to the uploadPath built from the character kind, id and item id', function() {
        spyOn(ItemDetailHelper, 'render').and.returnValue(null);
        spyOn(AuthStorage, 'getToken').and.returnValue('auth-tok');
        spyOn(PhotoUploadModalController.prototype, 'handleSubmit').and.returnValue(Promise.resolve());
        let capturedHandlers;
        spyOn(PhotoUploadModalHelper, 'render').and.callFake((show, state, handlers) => {
          capturedHandlers = handlers;
          return null;
        });

        renderToStaticMarkup(
          React.createElement(CharacterItem, { characterKind, ControllerClass: LoadedController }),
        );

        capturedHandlers.onSubmit();

        const { character_id: characterId } = CharacterItemDetailController
          .getParamsFromHash(characterKind, hash);
        expect(PhotoUploadModalController.prototype.handleSubmit).toHaveBeenCalledWith(
          `/games/demo/${characterKind}/${characterId}/items/1/photo_upload.json`,
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

        renderToStaticMarkup(
          React.createElement(CharacterItem, { characterKind, ControllerClass: LoadedController }),
        );

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

        renderToStaticMarkup(
          React.createElement(CharacterItem, { characterKind, ControllerClass: LoadedController }),
        );

        const callsBefore = buildEffectSpy.calls.count();

        expect(() => {
          capturedHandlers.onClose();
          capturedHandlers.onCancel();
        }).not.toThrow();
        expect(buildEffectSpy.calls.count()).toBe(callsBefore);
      });
    });
  });
});
