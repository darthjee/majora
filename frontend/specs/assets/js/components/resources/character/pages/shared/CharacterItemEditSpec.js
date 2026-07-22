import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import CharacterItemEdit
  from '../../../../../../../../assets/js/components/resources/character/pages/shared/CharacterItemEdit.jsx';
import BaseCharacterItemEditController
  from '../../../../../../../../assets/js/components/resources/character/pages/controllers/BaseCharacterItemEditController.js';
import ItemEditHelper
  from '../../../../../../../../assets/js/components/resources/item/pages/helpers/ItemEditHelper.jsx';
import PhotoUploadModalHelper
  from '../../../../../../../../assets/js/components/common/modals/helpers/PhotoUploadModalHelper.jsx';
import PhotoUploadModalController
  from '../../../../../../../../assets/js/components/common/modals/controllers/PhotoUploadModalController.js';
import AuthStorage from '../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';

const loadedItem = { id: 1, name: 'Cloak of Elvenkind', description: 'A shimmering cloak.', photo_path: '/item.png' };

/** Stub controller that synchronously loads an item during construction. */
class LoadedController {
  constructor(setItem, setLoading) {
    setItem(loadedItem);
    setLoading(false);
  }

  buildEffect() { return () => Noop.noop; }
  submitForm() { return Promise.resolve(); }
  // eslint-disable-next-line no-empty-function
  applyLoadedItem() {}
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

[
  { label: 'pcs', characterKind: 'pcs', hash: '#/games/demo/pcs/7/items/1/edit' },
  { label: 'npcs', characterKind: 'npcs', hash: '#/games/demo/npcs/9/items/1/edit' },
].forEach(({ label, characterKind, hash }) => {
  describe(`CharacterItemEdit (${label})`, function() {
    let originalWindow;
    let getParamsFromHash;

    beforeEach(function() {
      originalWindow = globalThis.window;
      globalThis.window = { location: { hash } };
      getParamsFromHash = (currentHash) => BaseCharacterItemEditController.getParamsFromHash(characterKind, currentHash);
    });

    afterEach(function() {
      globalThis.window = originalWindow;
    });

    const build = (ControllerClass) => React.createElement(CharacterItemEdit, {
      characterKind, ControllerClass, getParamsFromHash,
    });

    it('renders the loading state while the item is loading', function() {
      const html = renderToStaticMarkup(build(LoadingController));

      expect(html).toContain('Loading item...');
    });

    it('renders the error state when the item fails to load', function() {
      const html = renderToStaticMarkup(build(ErroredController));

      expect(html).toContain('Unable to load item.');
    });

    it('delegates to ItemEditHelper.render with the photo path and form handlers', function() {
      let captured;
      spyOn(ItemEditHelper, 'render').and.callFake((state, handlers) => {
        captured = { state, handlers };
        return null;
      });

      renderToStaticMarkup(build(LoadedController));

      expect(captured.state.photo_path).toBe('/item.png');
      expect(captured.state.status).toBe('idle');
      expect(typeof captured.handlers.onSubmit).toBe('function');
      expect(typeof captured.handlers.onNameChange).toBe('function');
      expect(typeof captured.handlers.onDescriptionChange).toBe('function');
      expect(typeof captured.handlers.onHiddenChange).toBe('function');
      expect(typeof captured.handlers.onOpenUploadModal).toBe('function');
    });

    it('delegates form submission to the controller with the current fields', function() {
      let capturedHandlers;
      spyOn(ItemEditHelper, 'render').and.callFake((state, handlers) => {
        capturedHandlers = handlers;
        return null;
      });
      const submitFormSpy = spyOn(LoadedController.prototype, 'submitForm').and.returnValue(Promise.resolve());

      renderToStaticMarkup(build(LoadedController));

      const event = { preventDefault: Noop.noop };
      capturedHandlers.onSubmit(event);

      const { game_slug: gameSlug, character_id: characterId, id: itemId } = getParamsFromHash(hash);
      expect(submitFormSpy).toHaveBeenCalledWith(
        event, gameSlug, characterId, itemId, { name: '', description: '', hidden: false }, jasmine.any(Object),
      );
    });

    describe('upload modal', function() {
      it('wires the modal to the uploadPath built from the character kind, id and item id', function() {
        spyOn(ItemEditHelper, 'render').and.returnValue(null);
        spyOn(AuthStorage, 'getToken').and.returnValue('auth-tok');
        spyOn(PhotoUploadModalController.prototype, 'handleSubmit').and.returnValue(Promise.resolve());
        let capturedHandlers;
        spyOn(PhotoUploadModalHelper, 'render').and.callFake((show, state, handlers) => {
          capturedHandlers = handlers;
          return null;
        });

        renderToStaticMarkup(build(LoadedController));

        capturedHandlers.onSubmit();

        const { character_id: characterId } = getParamsFromHash(hash);
        expect(PhotoUploadModalController.prototype.handleSubmit).toHaveBeenCalledWith(
          `/games/demo/${characterKind}/${characterId}/items/1/photo_upload.json`,
          null,
          'auth-tok'
        );
      });

      it('refetches the item via buildEffect when the upload succeeds', function() {
        spyOn(ItemEditHelper, 'render').and.returnValue(null);
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

        renderToStaticMarkup(build(LoadedController));

        const callsBefore = buildEffectSpy.calls.count();

        capturedHandlers.onSubmit();

        expect(buildEffectSpy.calls.count()).toBe(callsBefore + 1);
      });

      it('closes without refetching when the modal is dismissed', function() {
        spyOn(ItemEditHelper, 'render').and.returnValue(null);
        const buildEffectSpy = spyOn(LoadedController.prototype, 'buildEffect')
          .and.returnValue(() => Noop.noop);
        let capturedHandlers;
        spyOn(PhotoUploadModalHelper, 'render').and.callFake((show, state, handlers) => {
          capturedHandlers = handlers;
          return null;
        });

        renderToStaticMarkup(build(LoadedController));

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
