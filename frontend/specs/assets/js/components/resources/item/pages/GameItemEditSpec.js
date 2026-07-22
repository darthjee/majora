import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameItemEdit from '../../../../../../../assets/js/components/resources/item/pages/GameItemEdit.jsx';
import ItemEditHelper from '../../../../../../../assets/js/components/resources/item/pages/helpers/ItemEditHelper.jsx';
import PhotoUploadModalHelper
  from '../../../../../../../assets/js/components/common/modals/helpers/PhotoUploadModalHelper.jsx';
import PhotoUploadModalController
  from '../../../../../../../assets/js/components/common/modals/controllers/PhotoUploadModalController.js';
import AuthStorage from '../../../../../../../assets/js/utils/auth/AuthStorage.js';
import Noop from '../../../../../../../assets/js/utils/Noop.js';

const loadedItem = { id: 5, name: 'Cloak of Elvenkind', description: 'A shimmering cloak.', photo_path: '/item.png' };

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

describe('GameItemEdit', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/items/5/edit' } };
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('renders the loading state while the item is loading', function() {
    const html = renderToStaticMarkup(
      React.createElement(GameItemEdit, { ControllerClass: LoadingController }),
    );

    expect(html).toContain('Loading item...');
  });

  it('renders the error state when the item fails to load', function() {
    const html = renderToStaticMarkup(
      React.createElement(GameItemEdit, { ControllerClass: ErroredController }),
    );

    expect(html).toContain('Unable to load item.');
  });

  it('delegates to ItemEditHelper.render with the photo path and form handlers', function() {
    let captured;
    spyOn(ItemEditHelper, 'render').and.callFake((state, handlers) => {
      captured = { state, handlers };
      return null;
    });

    renderToStaticMarkup(React.createElement(GameItemEdit, { ControllerClass: LoadedController }));

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

    renderToStaticMarkup(React.createElement(GameItemEdit, { ControllerClass: LoadedController }));

    const event = { preventDefault: Noop.noop };
    capturedHandlers.onSubmit(event);

    expect(submitFormSpy).toHaveBeenCalledWith(
      event, 'demo', '5', { name: '', description: '', hidden: false }, jasmine.any(Object),
    );
  });

  describe('upload modal', function() {
    it('wires the modal to the uploadPath built from the game slug and item id', function() {
      spyOn(ItemEditHelper, 'render').and.returnValue(null);
      spyOn(AuthStorage, 'getToken').and.returnValue('auth-tok');
      spyOn(PhotoUploadModalController.prototype, 'handleSubmit').and.returnValue(Promise.resolve());
      let capturedHandlers;
      spyOn(PhotoUploadModalHelper, 'render').and.callFake((show, state, handlers) => {
        capturedHandlers = handlers;
        return null;
      });

      renderToStaticMarkup(React.createElement(GameItemEdit, { ControllerClass: LoadedController }));

      capturedHandlers.onSubmit();

      expect(PhotoUploadModalController.prototype.handleSubmit).toHaveBeenCalledWith(
        '/games/demo/items/5/photo_upload.json',
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

      renderToStaticMarkup(React.createElement(GameItemEdit, { ControllerClass: LoadedController }));

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

      renderToStaticMarkup(React.createElement(GameItemEdit, { ControllerClass: LoadedController }));

      const callsBefore = buildEffectSpy.calls.count();

      expect(() => {
        capturedHandlers.onClose();
        capturedHandlers.onCancel();
      }).not.toThrow();
      expect(buildEffectSpy.calls.count()).toBe(callsBefore);
    });
  });
});
