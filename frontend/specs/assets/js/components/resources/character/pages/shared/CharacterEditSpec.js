import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import CharacterEdit from '../../../../../../../../assets/js/components/resources/character/pages/shared/CharacterEdit.jsx';
import CharacterHelper from '../../../../../../../../assets/js/components/resources/character/pages/helpers/CharacterHelper.jsx';
import BaseCharacterEditHelper
  from '../../../../../../../../assets/js/components/resources/character/pages/helpers/BaseCharacterEditHelper.jsx';
import PhotoUploadModalHelper
  from '../../../../../../../../assets/js/components/common/helpers/PhotoUploadModalHelper.jsx';
import PhotoUploadModalController
  from '../../../../../../../../assets/js/components/common/controllers/PhotoUploadModalController.js';
import AuthStorage from '../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';
import { stubRenderLoading } from '../../../../../../../support/controllerStubs.js';

class FakeController {
  buildEffect() { return () => Noop.noop; }
  // eslint-disable-next-line no-empty-function
  applyLoadedCharacter() {}
  // eslint-disable-next-line no-empty-function
  submitForm() {}
}

// Sets character/loading state synchronously during render (in the useMemo
// factory), so the "loaded" branch of CharacterEdit is reachable via
// renderToStaticMarkup even though useEffect never runs during SSR.
class LoadedController {
  constructor(setCharacter, setLoading) {
    setCharacter({ can_edit: true });
    setLoading(false);
  }

  buildEffect() { return () => Noop.noop; }
  // eslint-disable-next-line no-empty-function
  applyLoadedCharacter() {}
  // eslint-disable-next-line no-empty-function
  submitForm() {}
}

describe('CharacterEdit', function() {
  let getParamsFromHash;
  let EditHelper;

  beforeEach(function() {
    getParamsFromHash = jasmine.createSpy('getParamsFromHash').and.returnValue({
      game_slug: 'demo',
      character_id: '1',
    });
    EditHelper = new BaseCharacterEditHelper('test', 'npc_edit_page');
  });

  it('renders the loading state on initial render before the fetch resolves', function() {
    stubRenderLoading(CharacterHelper);

    const html = renderToStaticMarkup(
      React.createElement(CharacterEdit, {
        ControllerClass: FakeController,
        getParamsFromHash,
        EditHelper,
        characterKind: 'pcs',
      })
    );

    expect(html).toContain('loading');
  });

  it('renders the edit form via EditHelper.render when the character is loaded', function() {
    const state = {
      isFullEditor: true,
      name: 'Test Character',
      profile_photo_path: null,
      links: [],
      role: 'Fighter',
      description: 'A brave hero.',
      privateDescription: 'DM notes.',
      money: '310',
      allegiance: 'ally',
      publicAllegiance: 'enemy',
      publicSlain: false,
      status: 'idle',
      fieldErrors: {},
    };
    const handlers = {
      onSubmit: Noop.noop,
      onNameChange: Noop.noop,
      onRoleChange: Noop.noop,
      onDescriptionChange: Noop.noop,
      onPrivateDescriptionChange: Noop.noop,
      onMoneyChange: Noop.noop,
      onAllegianceChange: Noop.noop,
      onPublicAllegianceChange: Noop.noop,
      onPublicSlainChange: Noop.noop,
      onOpenUploadModal: Noop.noop,
      onOpenLinksModal: Noop.noop,
      onOpenMoneyModal: Noop.noop,
    };

    const html = renderToStaticMarkup(EditHelper.render(state, handlers));

    expect(html).toContain('id="test-edit-name"');
    expect(html).toContain('value="Test Character"');
    expect(html).toContain('20');
    expect(html).toContain('29');
  });

  it('passes allegiance/publicAllegiance state and change handlers into EditHelper.render', function() {
    let captured;
    spyOn(EditHelper, 'render').and.callFake((state, handlers) => {
      captured = { state, handlers };
      return null;
    });

    renderToStaticMarkup(
      React.createElement(CharacterEdit, {
        ControllerClass: LoadedController,
        getParamsFromHash,
        EditHelper,
        characterKind: 'npcs',
      })
    );

    expect(captured.state.allegiance).toBe('neutral');
    expect(captured.state.publicAllegiance).toBe('neutral');
    expect(typeof captured.handlers.onAllegianceChange).toBe('function');
    expect(typeof captured.handlers.onPublicAllegianceChange).toBe('function');

    captured.handlers.onAllegianceChange({ target: { value: 'ally' } });
    captured.handlers.onPublicAllegianceChange({ target: { value: 'enemy' } });
  });

  describe('upload modal', function() {
    it('wires the modal to the uploadPath built from characterKind, gameSlug and characterId', function() {
      spyOn(AuthStorage, 'getToken').and.returnValue('auth-tok');
      spyOn(PhotoUploadModalController.prototype, 'handleSubmit').and.returnValue(Promise.resolve());
      let capturedHandlers;
      spyOn(PhotoUploadModalHelper, 'render').and.callFake((show, state, handlers) => {
        capturedHandlers = handlers;
        return null;
      });

      renderToStaticMarkup(
        React.createElement(CharacterEdit, {
          ControllerClass: LoadedController,
          getParamsFromHash,
          EditHelper,
          characterKind: 'pcs',
        })
      );

      capturedHandlers.onSubmit();

      expect(PhotoUploadModalController.prototype.handleSubmit).toHaveBeenCalledWith(
        '/games/demo/pcs/1/photo_upload.json',
        null,
        'auth-tok'
      );
    });

    it('builds the uploadPath using the npcs segment for NPC characters', function() {
      spyOn(AuthStorage, 'getToken').and.returnValue('auth-tok');
      spyOn(PhotoUploadModalController.prototype, 'handleSubmit').and.returnValue(Promise.resolve());
      let capturedHandlers;
      spyOn(PhotoUploadModalHelper, 'render').and.callFake((show, state, handlers) => {
        capturedHandlers = handlers;
        return null;
      });

      renderToStaticMarkup(
        React.createElement(CharacterEdit, {
          ControllerClass: LoadedController,
          getParamsFromHash,
          EditHelper,
          characterKind: 'npcs',
        })
      );

      capturedHandlers.onSubmit();

      expect(PhotoUploadModalController.prototype.handleSubmit).toHaveBeenCalledWith(
        '/games/demo/npcs/1/photo_upload.json',
        null,
        'auth-tok'
      );
    });

    it('hides the modal on success and close without refetching the character', function() {
      spyOn(LoadedController.prototype, 'applyLoadedCharacter');
      let capturedHandlers;
      spyOn(PhotoUploadModalHelper, 'render').and.callFake((show, state, handlers) => {
        capturedHandlers = handlers;
        return null;
      });

      renderToStaticMarkup(
        React.createElement(CharacterEdit, {
          ControllerClass: LoadedController,
          getParamsFromHash,
          EditHelper,
          characterKind: 'npcs',
        })
      );

      const callsBefore = LoadedController.prototype.applyLoadedCharacter.calls.count();

      expect(() => {
        capturedHandlers.onClose();
        capturedHandlers.onCancel();
      }).not.toThrow();

      expect(LoadedController.prototype.applyLoadedCharacter.calls.count()).toBe(callsBefore);
    });

    it('refetches the character via buildEffect when the upload succeeds', function() {
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
        React.createElement(CharacterEdit, {
          ControllerClass: LoadedController,
          getParamsFromHash,
          EditHelper,
          characterKind: 'pcs',
        })
      );

      const callsBefore = buildEffectSpy.calls.count();

      capturedHandlers.onSubmit();

      expect(buildEffectSpy.calls.count()).toBe(callsBefore + 1);
    });
  });
});
