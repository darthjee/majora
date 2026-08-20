import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GamePossessionEdit
  from '../../../../../../../assets/js/components/resources/possession/pages/GamePossessionEdit.jsx';
import PossessionEditHelper
  from '../../../../../../../assets/js/components/resources/possession/pages/helpers/PossessionEditHelper.jsx';
import PhotoUploadModalHelper
  from '../../../../../../../assets/js/components/common/modals/helpers/PhotoUploadModalHelper.jsx';
import PhotoUploadModalController
  from '../../../../../../../assets/js/components/common/modals/controllers/PhotoUploadModalController.js';
import AuthStorage from '../../../../../../../assets/js/utils/auth/AuthStorage.js';
import Noop from '../../../../../../../assets/js/utils/Noop.js';

const loadedPossession = {
  id: 5, name: 'Old Tavern', description: 'A cozy roadside tavern.', photo_path: '/possession.png',
};

/** Stub controller that synchronously loads a possession during construction. */
class LoadedController {
  constructor(setPossession, setLoading) {
    setPossession(loadedPossession);
    setLoading(false);
  }

  buildEffect() { return () => Noop.noop; }
  submitForm() { return Promise.resolve(); }
  applyLoadedItem() { Noop.noop(); }
}

/** Stub controller that stays in the loading state. */
class LoadingController {
  buildEffect() { return () => Noop.noop; }
}

/** Stub controller that synchronously sets an error during construction. */
class ErroredController {
  constructor(setPossession, setLoading, setError) {
    setError('Unable to load possession.');
    setLoading(false);
  }

  buildEffect() { return () => Noop.noop; }
}

describe('GamePossessionEdit', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/possessions/5/edit' } };
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('renders the loading state while the possession is loading', function() {
    const html = renderToStaticMarkup(
      React.createElement(GamePossessionEdit, { ControllerClass: LoadingController }),
    );

    expect(html).toContain('Loading possession...');
  });

  it('renders the error state when the possession fails to load', function() {
    const html = renderToStaticMarkup(
      React.createElement(GamePossessionEdit, { ControllerClass: ErroredController }),
    );

    expect(html).toContain('Unable to load possession.');
  });

  it('delegates to PossessionEditHelper.render with the photo path and form handlers', function() {
    let captured;
    spyOn(PossessionEditHelper, 'render').and.callFake((state, handlers) => {
      captured = { state, handlers };
      return null;
    });

    renderToStaticMarkup(React.createElement(GamePossessionEdit, { ControllerClass: LoadedController }));

    expect(captured.state.photo_path).toBe('/possession.png');
    expect(captured.state.status).toBe('idle');
    expect(typeof captured.handlers.onSubmit).toBe('function');
    expect(typeof captured.handlers.onNameChange).toBe('function');
    expect(typeof captured.handlers.onDescriptionChange).toBe('function');
    expect(typeof captured.handlers.onHiddenChange).toBe('function');
    expect(typeof captured.handlers.onOpenUploadModal).toBe('function');
  });

  it('delegates form submission to the controller with the current fields', function() {
    let capturedHandlers;
    spyOn(PossessionEditHelper, 'render').and.callFake((state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });
    const submitFormSpy = spyOn(LoadedController.prototype, 'submitForm').and.returnValue(Promise.resolve());

    renderToStaticMarkup(React.createElement(GamePossessionEdit, { ControllerClass: LoadedController }));

    const event = { preventDefault: Noop.noop };
    capturedHandlers.onSubmit(event);

    expect(submitFormSpy).toHaveBeenCalledWith(
      event, 'demo', '5', { name: '', description: '', hidden: false }, jasmine.any(Object),
    );
  });

  describe('upload modal', function() {
    it('wires the modal to the uploadPath built from the game slug and possession id', function() {
      spyOn(PossessionEditHelper, 'render').and.returnValue(null);
      spyOn(AuthStorage, 'getToken').and.returnValue('auth-tok');
      spyOn(PhotoUploadModalController.prototype, 'handleSubmit').and.returnValue(Promise.resolve());
      let capturedHandlers;
      spyOn(PhotoUploadModalHelper, 'render').and.callFake((show, state, handlers) => {
        capturedHandlers = handlers;
        return null;
      });

      renderToStaticMarkup(React.createElement(GamePossessionEdit, { ControllerClass: LoadedController }));

      capturedHandlers.onSubmit();

      expect(PhotoUploadModalController.prototype.handleSubmit).toHaveBeenCalledWith(
        '/games/demo/possessions/5/photo_upload.json',
        null,
        'auth-tok'
      );
    });

    it('refetches the possession via buildEffect when the upload succeeds', function() {
      spyOn(PossessionEditHelper, 'render').and.returnValue(null);
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

      renderToStaticMarkup(React.createElement(GamePossessionEdit, { ControllerClass: LoadedController }));

      const callsBefore = buildEffectSpy.calls.count();

      capturedHandlers.onSubmit();

      expect(buildEffectSpy.calls.count()).toBe(callsBefore + 1);
    });

    it('closes without refetching when the modal is dismissed', function() {
      spyOn(PossessionEditHelper, 'render').and.returnValue(null);
      const buildEffectSpy = spyOn(LoadedController.prototype, 'buildEffect')
        .and.returnValue(() => Noop.noop);
      let capturedHandlers;
      spyOn(PhotoUploadModalHelper, 'render').and.callFake((show, state, handlers) => {
        capturedHandlers = handlers;
        return null;
      });

      renderToStaticMarkup(React.createElement(GamePossessionEdit, { ControllerClass: LoadedController }));

      const callsBefore = buildEffectSpy.calls.count();

      expect(() => {
        capturedHandlers.onClose();
        capturedHandlers.onCancel();
      }).not.toThrow();
      expect(buildEffectSpy.calls.count()).toBe(callsBefore);
    });
  });
});
