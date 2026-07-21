import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameNpcNew from '../../../../../../../assets/js/components/resources/character/pages/GameNpcNew.jsx';
import GameNpcNewController from '../../../../../../../assets/js/components/resources/character/pages/controllers/GameNpcNewController.js';
import GameNpcNewHelper from '../../../../../../../assets/js/components/resources/character/pages/helpers/GameNpcNewHelper.jsx';
import PhotoUploadModalHelper
  from '../../../../../../../assets/js/components/common/modals/helpers/PhotoUploadModalHelper.jsx';
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
    expect(html).toContain('id="game-npc-new-money"');
    expect(html).toContain('id="game-npc-new-hidden"');
    expect(html).toContain('id="game-npc-new-allegiance"');
    expect(html).toContain('id="game-npc-new-public-allegiance"');
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
});
