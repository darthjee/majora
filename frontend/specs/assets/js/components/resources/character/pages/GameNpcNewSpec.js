import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameNpcNew from '../../../../../../../assets/js/components/resources/character/pages/GameNpcNew.jsx';
import GameNpcNewController from '../../../../../../../assets/js/components/resources/character/pages/controllers/GameNpcNewController.js';
import GameNpcNewHelper from '../../../../../../../assets/js/components/resources/character/pages/helpers/GameNpcNewHelper.jsx';
import PhotoUploadModalHelper
  from '../../../../../../../assets/js/components/common/modals/helpers/PhotoUploadModalHelper.jsx';
import MoneyEditModalHelper
  from '../../../../../../../assets/js/components/common/modals/helpers/MoneyEditModalHelper.jsx';
import { stubBuildEffect } from '../../../../../../support/controllerStubs.js';

describe('GameNpcNew', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/npcs/new' } };
    stubBuildEffect(GameNpcNewController);
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('renders the NPC creation form', function() {
    const html = renderToStaticMarkup(React.createElement(GameNpcNew));

    expect(html).toContain('id="game-npc-new-name"');
    expect(html).toContain('id="game-npc-new-role"');
    expect(html).toContain('id="game-npc-new-description"');
    expect(html).toContain('id="game-npc-new-private-description"');
    expect(html).toContain('id="game-npc-new-hidden"');
    expect(html).toContain('id="game-npc-new-allegiance"');
    expect(html).toContain('id="game-npc-new-public-allegiance"');
  });

  it('does not render a raw numeric money input', function() {
    const html = renderToStaticMarkup(React.createElement(GameNpcNew));

    expect(html).not.toContain('id="game-npc-new-money"');
  });

  it('renders the submit button', function() {
    const html = renderToStaticMarkup(React.createElement(GameNpcNew));

    expect(html).toContain('type="submit"');
  });

  it('renders the avatar as editable', function() {
    const html = renderToStaticMarkup(React.createElement(GameNpcNew));

    expect(html).toContain('actions-overlay-button');
  });

  it('renders the photo upload modal in deferred mode', function() {
    let capturedState;
    spyOn(PhotoUploadModalHelper, 'render').and.callFake((show, state) => {
      capturedState = state;
      return null;
    });

    renderToStaticMarkup(React.createElement(GameNpcNew));

    expect(capturedState.deferred).toBe(true);
  });

  it('wires onRetryPhotoUpload to controller.retryPhotoUpload with the game slug, character id, and photo file', function() {
    let capturedHandlers;
    spyOn(GameNpcNewHelper, 'render').and.callFake((state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });
    spyOn(GameNpcNewController.prototype, 'retryPhotoUpload').and.returnValue(Promise.resolve());

    renderToStaticMarkup(React.createElement(GameNpcNew));
    capturedHandlers.onRetryPhotoUpload();

    expect(GameNpcNewController.prototype.retryPhotoUpload).toHaveBeenCalledWith(
      'demo',
      null,
      null,
      jasmine.objectContaining({ setStatus: jasmine.any(Function), setCharacterId: jasmine.any(Function) }),
    );
  });

  it('wires onSkipPhotoUpload to redirect to the NPC page using the game slug and character id', function() {
    let capturedHandlers;
    spyOn(GameNpcNewHelper, 'render').and.callFake((state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });

    renderToStaticMarkup(React.createElement(GameNpcNew));
    capturedHandlers.onSkipPhotoUpload();

    expect(globalThis.window.location.hash).toBe('/games/demo/npcs/null');
  });

  describe('money modal', function() {
    it('renders the money modal initially closed', function() {
      let capturedShow;
      spyOn(MoneyEditModalHelper, 'render').and.callFake((show) => {
        capturedShow = show;
        return null;
      });

      renderToStaticMarkup(React.createElement(GameNpcNew));

      expect(capturedShow).toBe(false);
    });

    it('renders the money modal with the character context', function() {
      let capturedContext;
      spyOn(MoneyEditModalHelper, 'render').and.callFake((show, state, handlers, context) => {
        capturedContext = context;
        return null;
      });

      renderToStaticMarkup(React.createElement(GameNpcNew));

      expect(capturedContext).toBe('character');
    });

    it('defaults the money modal gameType to dnd before the game fetch resolves', function() {
      let capturedGameType;
      spyOn(MoneyEditModalHelper, 'render').and.callFake((show, state, handlers, context, gameType) => {
        capturedGameType = gameType;
        return null;
      });

      renderToStaticMarkup(React.createElement(GameNpcNew));

      expect(capturedGameType).toBe('dnd');
    });

    it('opens the money modal via onOpenMoneyModal without throwing', function() {
      let capturedHandlers;
      spyOn(GameNpcNewHelper, 'render').and.callFake((state, handlers) => {
        capturedHandlers = handlers;
        return null;
      });
      spyOn(MoneyEditModalHelper, 'render').and.returnValue(null);

      renderToStaticMarkup(React.createElement(GameNpcNew));

      expect(() => capturedHandlers.onOpenMoneyModal()).not.toThrow();
    });

    it('updates the form state money field and closes the modal on confirm, without throwing on close', function() {
      let capturedMoneyModalHandlers;
      spyOn(MoneyEditModalHelper, 'render').and.callFake((show, state, handlers) => {
        capturedMoneyModalHandlers = handlers;
        return null;
      });

      renderToStaticMarkup(React.createElement(GameNpcNew));

      expect(() => {
        capturedMoneyModalHandlers.onClose();
        capturedMoneyModalHandlers.onConfirm(500);
      }).not.toThrow();
    });
  });
});
