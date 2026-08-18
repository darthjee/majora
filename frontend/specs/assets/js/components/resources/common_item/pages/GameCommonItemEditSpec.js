import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameCommonItemEdit
  from '../../../../../../../assets/js/components/resources/common_item/pages/GameCommonItemEdit.jsx';
import CommonItemEditHelper
  from '../../../../../../../assets/js/components/resources/common_item/pages/helpers/CommonItemEditHelper.jsx';
import PhotoUploadModalHelper
  from '../../../../../../../assets/js/components/common/modals/helpers/PhotoUploadModalHelper.jsx';
import PhotoUploadModalController
  from '../../../../../../../assets/js/components/common/modals/controllers/PhotoUploadModalController.js';
import MoneyEditModalHelper
  from '../../../../../../../assets/js/components/common/modals/helpers/MoneyEditModalHelper.jsx';
import AuthStorage from '../../../../../../../assets/js/utils/auth/AuthStorage.js';
import Noop from '../../../../../../../assets/js/utils/Noop.js';

const loadedCommonItem = {
  id: 5, name: 'Healing Potion', description: 'Heals wounds.', price: 50, category: 'potion',
  photo_path: '/common_item.png',
};

/** Stub controller that synchronously loads a common item during construction. */
class LoadedController {
  constructor(setCommonItem, setLoading) {
    setCommonItem(loadedCommonItem);
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
  constructor(setCommonItem, setLoading, setError) {
    setError('Unable to load common item.');
    setLoading(false);
  }

  buildEffect() { return () => Noop.noop; }
}

describe('GameCommonItemEdit', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/common_items/5/edit' } };
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('renders the loading state while the common item is loading', function() {
    const html = renderToStaticMarkup(
      React.createElement(GameCommonItemEdit, { ControllerClass: LoadingController }),
    );

    expect(html).toContain('Loading common item...');
  });

  it('renders the error state when the common item fails to load', function() {
    const html = renderToStaticMarkup(
      React.createElement(GameCommonItemEdit, { ControllerClass: ErroredController }),
    );

    expect(html).toContain('Unable to load common item.');
  });

  it('delegates to CommonItemEditHelper.render with the photo path and form handlers', function() {
    let captured;
    spyOn(CommonItemEditHelper, 'render').and.callFake((state, handlers) => {
      captured = { state, handlers };
      return null;
    });

    renderToStaticMarkup(React.createElement(GameCommonItemEdit, { ControllerClass: LoadedController }));

    expect(captured.state.photo_path).toBe('/common_item.png');
    expect(captured.state.status).toBe('idle');
    expect(typeof captured.handlers.onSubmit).toBe('function');
    expect(typeof captured.handlers.onNameChange).toBe('function');
    expect(typeof captured.handlers.onDescriptionChange).toBe('function');
    expect(typeof captured.handlers.onCategoryChange).toBe('function');
    expect(typeof captured.handlers.onHiddenChange).toBe('function');
    expect(typeof captured.handlers.onOpenUploadModal).toBe('function');
    expect(typeof captured.handlers.onOpenPriceModal).toBe('function');
  });

  it('delegates form submission to the controller with the current fields', function() {
    let capturedHandlers;
    spyOn(CommonItemEditHelper, 'render').and.callFake((state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });
    const submitFormSpy = spyOn(LoadedController.prototype, 'submitForm').and.returnValue(Promise.resolve());

    renderToStaticMarkup(React.createElement(GameCommonItemEdit, { ControllerClass: LoadedController }));

    const event = { preventDefault: Noop.noop };
    capturedHandlers.onSubmit(event);

    expect(submitFormSpy).toHaveBeenCalledWith(
      event,
      'demo',
      '5',
      {
        name: '', description: '', price: '', category: 'other', hidden: false,
      },
      jasmine.any(Object),
    );
  });

  describe('upload modal', function() {
    it('wires the modal to the uploadPath built from the game slug and common item id', function() {
      spyOn(CommonItemEditHelper, 'render').and.returnValue(null);
      spyOn(AuthStorage, 'getToken').and.returnValue('auth-tok');
      spyOn(PhotoUploadModalController.prototype, 'handleSubmit').and.returnValue(Promise.resolve());
      let capturedHandlers;
      spyOn(PhotoUploadModalHelper, 'render').and.callFake((show, state, handlers) => {
        capturedHandlers = handlers;
        return null;
      });

      renderToStaticMarkup(React.createElement(GameCommonItemEdit, { ControllerClass: LoadedController }));

      capturedHandlers.onSubmit();

      expect(PhotoUploadModalController.prototype.handleSubmit).toHaveBeenCalledWith(
        '/games/demo/common_items/5/photo_upload.json',
        null,
        'auth-tok'
      );
    });

    it('refetches the common item via buildEffect when the upload succeeds', function() {
      spyOn(CommonItemEditHelper, 'render').and.returnValue(null);
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

      renderToStaticMarkup(React.createElement(GameCommonItemEdit, { ControllerClass: LoadedController }));

      const callsBefore = buildEffectSpy.calls.count();

      capturedHandlers.onSubmit();

      expect(buildEffectSpy.calls.count()).toBe(callsBefore + 1);
    });

    it('closes without refetching when the modal is dismissed', function() {
      spyOn(CommonItemEditHelper, 'render').and.returnValue(null);
      const buildEffectSpy = spyOn(LoadedController.prototype, 'buildEffect')
        .and.returnValue(() => Noop.noop);
      let capturedHandlers;
      spyOn(PhotoUploadModalHelper, 'render').and.callFake((show, state, handlers) => {
        capturedHandlers = handlers;
        return null;
      });

      renderToStaticMarkup(React.createElement(GameCommonItemEdit, { ControllerClass: LoadedController }));

      const callsBefore = buildEffectSpy.calls.count();

      expect(() => {
        capturedHandlers.onClose();
        capturedHandlers.onCancel();
      }).not.toThrow();
      expect(buildEffectSpy.calls.count()).toBe(callsBefore);
    });
  });

  describe('price modal', function() {
    it('renders the price modal with the treasure context', function() {
      spyOn(CommonItemEditHelper, 'render').and.returnValue(null);
      let capturedContext;
      spyOn(MoneyEditModalHelper, 'render').and.callFake((show, state, handlers, context) => {
        capturedContext = context;
        return null;
      });

      renderToStaticMarkup(React.createElement(GameCommonItemEdit, { ControllerClass: LoadedController }));

      expect(capturedContext).toBe('treasure');
    });

    it('opens the price modal via onOpenPriceModal without throwing', function() {
      let capturedHandlers;
      spyOn(CommonItemEditHelper, 'render').and.callFake((state, handlers) => {
        capturedHandlers = handlers;
        return null;
      });
      spyOn(MoneyEditModalHelper, 'render').and.returnValue(null);

      renderToStaticMarkup(React.createElement(GameCommonItemEdit, { ControllerClass: LoadedController }));

      expect(() => capturedHandlers.onOpenPriceModal()).not.toThrow();
    });

    it('does not throw when the price modal is closed or confirmed', function() {
      spyOn(CommonItemEditHelper, 'render').and.returnValue(null);
      let capturedMoneyModalHandlers;
      spyOn(MoneyEditModalHelper, 'render').and.callFake((show, state, handlers) => {
        capturedMoneyModalHandlers = handlers;
        return null;
      });

      renderToStaticMarkup(React.createElement(GameCommonItemEdit, { ControllerClass: LoadedController }));

      expect(() => {
        capturedMoneyModalHandlers.onClose();
        capturedMoneyModalHandlers.onConfirm(500);
      }).not.toThrow();
    });
  });
});
