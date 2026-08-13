import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import CharacterPossession
  from '../../../../../../../../assets/js/components/resources/character/pages/shared/CharacterPossession.jsx';
import CharacterPossessionDetailController
  from '../../../../../../../../assets/js/components/resources/character/pages/controllers/CharacterPossessionDetailController.js';
import PossessionDetailHelper
  from '../../../../../../../../assets/js/components/resources/possession/pages/helpers/PossessionDetailHelper.jsx';
import PhotoUploadModalHelper
  from '../../../../../../../../assets/js/components/common/modals/helpers/PhotoUploadModalHelper.jsx';
import PhotoUploadModalController
  from '../../../../../../../../assets/js/components/common/modals/controllers/PhotoUploadModalController.js';
import RequestStore from '../../../../../../../../assets/js/utils/requests/RequestStore.js';
import AuthStorage from '../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';

const loadedPossession = {
  id: 1, game_possession_id: 42, name: 'Old Tavern', description: 'A cozy inn.',
};

/** Stub controller that synchronously loads a possession (with upload permission) during construction. */
class LoadedController {
  constructor(characterKind, setPossession, setLoading, setError, setCanEdit, setCanUploadPhoto) {
    setPossession(loadedPossession);
    setCanEdit(true);
    setCanUploadPhoto(true);
    setLoading(false);
  }

  buildEffect() { return () => Noop.noop; }
}

/** Stub controller that synchronously loads a possession without upload or edit permission. */
class LoadedWithoutUploadController {
  constructor(characterKind, setPossession, setLoading, setError, setCanEdit, setCanUploadPhoto) {
    setPossession(loadedPossession);
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
  constructor(characterKind, setPossession, setLoading, setError) {
    setError('Unable to load possession.');
    setLoading(false);
  }

  buildEffect() { return () => Noop.noop; }
}

[
  { label: 'pcs', characterKind: 'pcs', hash: '#/games/demo/pcs/7/possessions/1' },
  { label: 'npcs', characterKind: 'npcs', hash: '#/games/demo/npcs/9/possessions/1' },
].forEach(({ label, characterKind, hash }) => {
  describe(`CharacterPossession (${label})`, function() {
    let originalWindow;

    beforeEach(function() {
      originalWindow = globalThis.window;
      globalThis.window = { location: { hash } };
    });

    afterEach(function() {
      globalThis.window = originalWindow;
    });

    it('renders the loading state while the possession is loading', function() {
      const html = renderToStaticMarkup(
        React.createElement(CharacterPossession, { characterKind, ControllerClass: LoadingController }),
      );

      expect(html).toContain('Loading possession...');
    });

    it('renders the error state when the possession fails to load', function() {
      const html = renderToStaticMarkup(
        React.createElement(CharacterPossession, { characterKind, ControllerClass: ErroredController }),
      );

      expect(html).toContain('Unable to load possession.');
    });

    it('delegates to PossessionDetailHelper.render with the possession, back href, edit href and gating', function() {
      let capturedPossession;
      let capturedBackHref;
      let capturedEditHref;
      let capturedCanEdit;
      let capturedCanUploadPhoto;
      let capturedOnUploadClick;
      spyOn(PossessionDetailHelper, 'render').and.callFake(
        (possession, backHref, editHref, canEdit, canUploadPhoto, onUploadClick) => {
          capturedPossession = possession;
          capturedBackHref = backHref;
          capturedEditHref = editHref;
          capturedCanEdit = canEdit;
          capturedCanUploadPhoto = canUploadPhoto;
          capturedOnUploadClick = onUploadClick;
          return null;
        },
      );

      renderToStaticMarkup(
        React.createElement(CharacterPossession, { characterKind, ControllerClass: LoadedController }),
      );

      const { character_id: characterId } = CharacterPossessionDetailController
        .getParamsFromHash(characterKind, hash);

      expect(capturedPossession).toEqual(loadedPossession);
      expect(capturedBackHref).toBe(`#/games/demo/${characterKind}/${characterId}/possessions`);
      expect(capturedEditHref).toBe(`#/games/demo/${characterKind}/${characterId}/possessions/1/edit`);
      expect(capturedCanEdit).toBe(true);
      expect(capturedCanUploadPhoto).toBe(true);
      expect(typeof capturedOnUploadClick).toBe('function');
    });

    it('passes canEdit=false and canUploadPhoto=false through when the controller denies them', function() {
      let capturedCanEdit;
      let capturedCanUploadPhoto;
      spyOn(PossessionDetailHelper, 'render').and.callFake((possession, backHref, editHref, canEdit, canUploadPhoto) => {
        capturedCanEdit = canEdit;
        capturedCanUploadPhoto = canUploadPhoto;
        return null;
      });

      renderToStaticMarkup(
        React.createElement(CharacterPossession, { characterKind, ControllerClass: LoadedWithoutUploadController }),
      );

      expect(capturedCanEdit).toBe(false);
      expect(capturedCanUploadPhoto).toBe(false);
    });

    it('opens the upload modal via the onUploadClick handler passed to PossessionDetailHelper', function() {
      let capturedOnUploadClick;
      spyOn(PossessionDetailHelper, 'render').and.callFake(
        (possession, backHref, editHref, canEdit, canUploadPhoto, onUploadClick) => {
          capturedOnUploadClick = onUploadClick;
          return null;
        },
      );

      renderToStaticMarkup(
        React.createElement(CharacterPossession, { characterKind, ControllerClass: LoadedController }),
      );

      expect(() => capturedOnUploadClick()).not.toThrow();
    });

    describe('upload modal', function() {
      it('wires the modal to the uploadPath built against the underlying GamePossession id', function() {
        spyOn(PossessionDetailHelper, 'render').and.returnValue(null);
        spyOn(AuthStorage, 'getToken').and.returnValue('auth-tok');
        spyOn(PhotoUploadModalController.prototype, 'handleSubmit').and.returnValue(Promise.resolve());
        let capturedHandlers;
        spyOn(PhotoUploadModalHelper, 'render').and.callFake((show, state, handlers) => {
          capturedHandlers = handlers;
          return null;
        });

        renderToStaticMarkup(
          React.createElement(CharacterPossession, { characterKind, ControllerClass: LoadedController }),
        );

        capturedHandlers.onSubmit();

        expect(PhotoUploadModalController.prototype.handleSubmit).toHaveBeenCalledWith(
          '/games/demo/possessions/42/photo_upload.json',
          null,
          'auth-tok',
        );
      });

      it('refetches the possession via buildEffect when the upload succeeds', function() {
        spyOn(PossessionDetailHelper, 'render').and.returnValue(null);
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
          React.createElement(CharacterPossession, { characterKind, ControllerClass: LoadedController }),
        );

        const callsBefore = buildEffectSpy.calls.count();

        capturedHandlers.onSubmit();

        expect(buildEffectSpy.calls.count()).toBe(callsBefore + 1);
      });

      it('purges the possession cache before refetching when the upload succeeds', function() {
        spyOn(PossessionDetailHelper, 'render').and.returnValue(null);
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

        renderToStaticMarkup(
          React.createElement(CharacterPossession, { characterKind, ControllerClass: LoadedController }),
        );

        capturedHandlers.onSubmit();

        expect(RequestStore.purge).toHaveBeenCalledWith({ resource: 'possession' });
      });

      it('closes without refetching when the modal is dismissed', function() {
        spyOn(PossessionDetailHelper, 'render').and.returnValue(null);
        const buildEffectSpy = spyOn(LoadedController.prototype, 'buildEffect')
          .and.returnValue(() => Noop.noop);
        let capturedHandlers;
        spyOn(PhotoUploadModalHelper, 'render').and.callFake((show, state, handlers) => {
          capturedHandlers = handlers;
          return null;
        });

        renderToStaticMarkup(
          React.createElement(CharacterPossession, { characterKind, ControllerClass: LoadedController }),
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
