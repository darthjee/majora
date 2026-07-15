import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import CharacterEdit from '../../../../../../../../assets/js/components/resources/character/pages/shared/CharacterEdit.jsx';
import BaseCharacterEditHelper
  from '../../../../../../../../assets/js/components/resources/character/pages/helpers/BaseCharacterEditHelper.jsx';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';

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

// Same as LoadedController, but simulates a player-only editor (a player of
// the game without dm/admin can_edit access to the NPC).
class PlayerOnlyLoadedController {
  constructor(setCharacter, setLoading) {
    setCharacter({ can_edit: false, is_player: true });
    setLoading(false);
  }

  buildEffect() { return () => Noop.noop; }
  // eslint-disable-next-line no-empty-function
  applyLoadedCharacter() {}
  // eslint-disable-next-line no-empty-function
  submitForm() {}
}

describe('CharacterEdit editor kind (player-only NPC editor vs. dm/admin)', function() {
  let getParamsFromHash;
  let EditHelper;

  beforeEach(function() {
    getParamsFromHash = jasmine.createSpy('getParamsFromHash').and.returnValue({
      game_slug: 'demo',
      character_id: '1',
    });
    EditHelper = new BaseCharacterEditHelper('test', 'npc_edit_page');
  });

  it('renders the edit form (not the loading state) when the character is a player-only editor', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterEdit, {
        ControllerClass: PlayerOnlyLoadedController,
        getParamsFromHash,
        EditHelper,
        characterKind: 'npcs',
      })
    );

    expect(html).not.toContain('loading');
  });

  it('passes isFullEditor: false into EditHelper.render for a player-only editor', function() {
    let captured;
    spyOn(EditHelper, 'render').and.callFake((state, handlers) => {
      captured = { state, handlers };
      return null;
    });

    renderToStaticMarkup(
      React.createElement(CharacterEdit, {
        ControllerClass: PlayerOnlyLoadedController,
        getParamsFromHash,
        EditHelper,
        characterKind: 'npcs',
      })
    );

    expect(captured.state.isFullEditor).toBe(false);
  });

  it('passes isFullEditor: true into EditHelper.render for a full (dm/admin) editor', function() {
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

    expect(captured.state.isFullEditor).toBe(true);
  });

  it('passes publicSlain state and an onPublicSlainChange handler into EditHelper.render', function() {
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

    expect(captured.state.publicSlain).toBe(false);
    expect(typeof captured.handlers.onPublicSlainChange).toBe('function');

    captured.handlers.onPublicSlainChange({ target: { checked: true } });
  });

  it('passes isFullEditor (character.can_edit) through to submitForm on submit', function() {
    const submitFormSpy = spyOn(PlayerOnlyLoadedController.prototype, 'submitForm');

    let capturedHandlers;
    spyOn(EditHelper, 'render').and.callFake((state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });

    renderToStaticMarkup(
      React.createElement(CharacterEdit, {
        ControllerClass: PlayerOnlyLoadedController,
        getParamsFromHash,
        EditHelper,
        characterKind: 'npcs',
      })
    );

    capturedHandlers.onSubmit({ preventDefault: Noop.noop });

    expect(submitFormSpy.calls.mostRecent().args[5]).toBe(false);
  });
});
