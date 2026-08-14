import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameFaction from '../../../../../../../assets/js/components/resources/faction/pages/GameFaction.jsx';
import FactionDetailHelper
  from '../../../../../../../assets/js/components/resources/faction/pages/helpers/FactionDetailHelper.jsx';
import PhotoUploadModalHelper
  from '../../../../../../../assets/js/components/common/modals/helpers/PhotoUploadModalHelper.jsx';
import PhotoUploadModalController
  from '../../../../../../../assets/js/components/common/modals/controllers/PhotoUploadModalController.js';
import RequestStore from '../../../../../../../assets/js/utils/requests/RequestStore.js';
import AuthStorage from '../../../../../../../assets/js/utils/auth/AuthStorage.js';
import Noop from '../../../../../../../assets/js/utils/Noop.js';

const loadedFaction = { id: 5, name: 'The Silver Hand' };

/** Stub controller that synchronously loads a faction (with upload/edit permission) during construction. */
class LoadedController {
  constructor(setFaction, setLoading, setError, setCanEdit, setCanUploadPhoto, setCanRecruitHidden) {
    setFaction(loadedFaction);
    setCanEdit(true);
    setCanUploadPhoto(true);
    setCanRecruitHidden(false);
    setLoading(false);
  }

  buildEffect() { return () => Noop.noop; }
}

/** Stub controller that synchronously loads a faction without upload or edit permission. */
class LoadedWithoutUploadController {
  constructor(setFaction, setLoading, setError, setCanEdit, setCanUploadPhoto, setCanRecruitHidden) {
    setFaction(loadedFaction);
    setCanEdit(false);
    setCanUploadPhoto(false);
    setCanRecruitHidden(false);
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
  constructor(setFaction, setLoading, setError) {
    setError('Unable to load faction.');
    setLoading(false);
  }

  buildEffect() { return () => Noop.noop; }
}

describe('GameFaction', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/factions/5' } };
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('renders the loading state while the faction is loading', function() {
    const html = renderToStaticMarkup(
      React.createElement(GameFaction, { ControllerClass: LoadingController }),
    );

    expect(html).toContain('Loading faction...');
  });

  it('renders the error state when the faction fails to load', function() {
    const html = renderToStaticMarkup(
      React.createElement(GameFaction, { ControllerClass: ErroredController }),
    );

    expect(html).toContain('Unable to load faction.');
  });

  it('delegates to FactionDetailHelper.render with the faction, back href, edit href and gating', function() {
    let capturedFaction;
    let capturedBackHref;
    let capturedEditHref;
    let capturedCanEdit;
    let capturedCanUploadPhoto;
    let capturedOnUploadClick;
    spyOn(FactionDetailHelper, 'render').and.callFake((
      faction, backHref, editHref, canEdit, canUploadPhoto, onUploadClick,
    ) => {
      capturedFaction = faction;
      capturedBackHref = backHref;
      capturedEditHref = editHref;
      capturedCanEdit = canEdit;
      capturedCanUploadPhoto = canUploadPhoto;
      capturedOnUploadClick = onUploadClick;
      return null;
    });

    renderToStaticMarkup(React.createElement(GameFaction, { ControllerClass: LoadedController }));

    expect(capturedFaction).toEqual(loadedFaction);
    expect(capturedBackHref).toBe('#/games/demo/factions');
    expect(capturedEditHref).toBe('#/games/demo/factions/5/edit');
    expect(capturedCanEdit).toBe(true);
    expect(capturedCanUploadPhoto).toBe(true);
    expect(typeof capturedOnUploadClick).toBe('function');
  });

  it('passes canEdit=false and canUploadPhoto=false through when the controller denies them', function() {
    let capturedCanEdit;
    let capturedCanUploadPhoto;
    spyOn(FactionDetailHelper, 'render').and.callFake((faction, backHref, editHref, canEdit, canUploadPhoto) => {
      capturedCanEdit = canEdit;
      capturedCanUploadPhoto = canUploadPhoto;
      return null;
    });

    renderToStaticMarkup(
      React.createElement(GameFaction, { ControllerClass: LoadedWithoutUploadController }),
    );

    expect(capturedCanEdit).toBe(false);
    expect(capturedCanUploadPhoto).toBe(false);
  });

  it('opens the upload modal via the onUploadClick handler passed to FactionDetailHelper', function() {
    let capturedOnUploadClick;
    spyOn(FactionDetailHelper, 'render').and.callFake((
      faction, backHref, editHref, canEdit, canUploadPhoto, onUploadClick,
    ) => {
      capturedOnUploadClick = onUploadClick;
      return null;
    });

    renderToStaticMarkup(React.createElement(GameFaction, { ControllerClass: LoadedController }));

    expect(() => capturedOnUploadClick()).not.toThrow();
  });

  describe('upload modal', function() {
    it('wires the modal to the uploadPath built from the game slug and faction id', function() {
      spyOn(FactionDetailHelper, 'render').and.returnValue(null);
      spyOn(AuthStorage, 'getToken').and.returnValue('auth-tok');
      spyOn(PhotoUploadModalController.prototype, 'handleSubmit').and.returnValue(Promise.resolve());
      let capturedHandlers;
      spyOn(PhotoUploadModalHelper, 'render').and.callFake((show, state, handlers) => {
        capturedHandlers = handlers;
        return null;
      });

      renderToStaticMarkup(React.createElement(GameFaction, { ControllerClass: LoadedController }));

      capturedHandlers.onSubmit();

      expect(PhotoUploadModalController.prototype.handleSubmit).toHaveBeenCalledWith(
        '/games/demo/factions/5/photo_upload.json',
        null,
        'auth-tok'
      );
    });

    it('refetches the faction via buildEffect when the upload succeeds', function() {
      spyOn(FactionDetailHelper, 'render').and.returnValue(null);
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

      renderToStaticMarkup(React.createElement(GameFaction, { ControllerClass: LoadedController }));

      const callsBefore = buildEffectSpy.calls.count();

      capturedHandlers.onSubmit();

      expect(buildEffectSpy.calls.count()).toBe(callsBefore + 1);
    });

    it('purges the faction cache before refetching when the upload succeeds', function() {
      spyOn(FactionDetailHelper, 'render').and.returnValue(null);
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

      renderToStaticMarkup(React.createElement(GameFaction, { ControllerClass: LoadedController }));

      capturedHandlers.onSubmit();

      expect(RequestStore.purge).toHaveBeenCalledWith({ resource: 'faction' });
    });

    it('closes without refetching when the modal is dismissed', function() {
      spyOn(FactionDetailHelper, 'render').and.returnValue(null);
      const buildEffectSpy = spyOn(LoadedController.prototype, 'buildEffect')
        .and.returnValue(() => Noop.noop);
      let capturedHandlers;
      spyOn(PhotoUploadModalHelper, 'render').and.callFake((show, state, handlers) => {
        capturedHandlers = handlers;
        return null;
      });

      renderToStaticMarkup(React.createElement(GameFaction, { ControllerClass: LoadedController }));

      const callsBefore = buildEffectSpy.calls.count();

      expect(() => {
        capturedHandlers.onClose();
        capturedHandlers.onCancel();
      }).not.toThrow();
      expect(buildEffectSpy.calls.count()).toBe(callsBefore);
    });
  });
});
