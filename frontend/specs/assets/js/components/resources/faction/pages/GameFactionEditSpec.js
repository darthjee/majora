import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameFactionEdit
  from '../../../../../../../assets/js/components/resources/faction/pages/GameFactionEdit.jsx';
import FactionEditHelper
  from '../../../../../../../assets/js/components/resources/faction/pages/helpers/FactionEditHelper.jsx';
import PhotoUploadModalHelper
  from '../../../../../../../assets/js/components/common/modals/helpers/PhotoUploadModalHelper.jsx';
import PhotoUploadModalController
  from '../../../../../../../assets/js/components/common/modals/controllers/PhotoUploadModalController.js';
import AuthStorage from '../../../../../../../assets/js/utils/auth/AuthStorage.js';
import Noop from '../../../../../../../assets/js/utils/Noop.js';

const loadedFaction = { id: 5, name: 'The Silver Hand', photo_path: '/faction.png' };

/** Stub controller that synchronously loads a faction during construction. */
class LoadedController {
  constructor(setFaction, setLoading) {
    setFaction(loadedFaction);
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
  constructor(setFaction, setLoading, setError) {
    setError('Unable to load faction.');
    setLoading(false);
  }

  buildEffect() { return () => Noop.noop; }
}

describe('GameFactionEdit', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/factions/5/edit' } };
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('renders the loading state while the faction is loading', function() {
    const html = renderToStaticMarkup(
      React.createElement(GameFactionEdit, { ControllerClass: LoadingController }),
    );

    expect(html).toContain('Loading faction...');
  });

  it('renders the error state when the faction fails to load', function() {
    const html = renderToStaticMarkup(
      React.createElement(GameFactionEdit, { ControllerClass: ErroredController }),
    );

    expect(html).toContain('Unable to load faction.');
  });

  it('delegates to FactionEditHelper.render with the photo path and form handlers', function() {
    let captured;
    spyOn(FactionEditHelper, 'render').and.callFake((state, handlers) => {
      captured = { state, handlers };
      return null;
    });

    renderToStaticMarkup(React.createElement(GameFactionEdit, { ControllerClass: LoadedController }));

    expect(captured.state.photo_path).toBe('/faction.png');
    expect(captured.state.status).toBe('idle');
    expect(typeof captured.handlers.onSubmit).toBe('function');
    expect(typeof captured.handlers.onNameChange).toBe('function');
    expect(typeof captured.handlers.onOpenUploadModal).toBe('function');
  });

  it('delegates form submission to the controller with the current fields', function() {
    let capturedHandlers;
    spyOn(FactionEditHelper, 'render').and.callFake((state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });
    const submitFormSpy = spyOn(LoadedController.prototype, 'submitForm').and.returnValue(Promise.resolve());

    renderToStaticMarkup(React.createElement(GameFactionEdit, { ControllerClass: LoadedController }));

    const event = { preventDefault: Noop.noop };
    capturedHandlers.onSubmit(event);

    expect(submitFormSpy).toHaveBeenCalledWith(
      event, 'demo', '5', { name: '' }, jasmine.any(Object),
    );
  });

  describe('upload modal', function() {
    it('wires the modal to the uploadPath built from the game slug and faction id', function() {
      spyOn(FactionEditHelper, 'render').and.returnValue(null);
      spyOn(AuthStorage, 'getToken').and.returnValue('auth-tok');
      spyOn(PhotoUploadModalController.prototype, 'handleSubmit').and.returnValue(Promise.resolve());
      let capturedHandlers;
      spyOn(PhotoUploadModalHelper, 'render').and.callFake((show, state, handlers) => {
        capturedHandlers = handlers;
        return null;
      });

      renderToStaticMarkup(React.createElement(GameFactionEdit, { ControllerClass: LoadedController }));

      capturedHandlers.onSubmit();

      expect(PhotoUploadModalController.prototype.handleSubmit).toHaveBeenCalledWith(
        '/games/demo/factions/5/photo_upload.json',
        null,
        'auth-tok'
      );
    });

    it('refetches the faction via buildEffect when the upload succeeds', function() {
      spyOn(FactionEditHelper, 'render').and.returnValue(null);
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

      renderToStaticMarkup(React.createElement(GameFactionEdit, { ControllerClass: LoadedController }));

      const callsBefore = buildEffectSpy.calls.count();

      capturedHandlers.onSubmit();

      expect(buildEffectSpy.calls.count()).toBe(callsBefore + 1);
    });

    it('closes without refetching when the modal is dismissed', function() {
      spyOn(FactionEditHelper, 'render').and.returnValue(null);
      const buildEffectSpy = spyOn(LoadedController.prototype, 'buildEffect')
        .and.returnValue(() => Noop.noop);
      let capturedHandlers;
      spyOn(PhotoUploadModalHelper, 'render').and.callFake((show, state, handlers) => {
        capturedHandlers = handlers;
        return null;
      });

      renderToStaticMarkup(React.createElement(GameFactionEdit, { ControllerClass: LoadedController }));

      const callsBefore = buildEffectSpy.calls.count();

      expect(() => {
        capturedHandlers.onClose();
        capturedHandlers.onCancel();
      }).not.toThrow();
      expect(buildEffectSpy.calls.count()).toBe(callsBefore);
    });
  });
});
