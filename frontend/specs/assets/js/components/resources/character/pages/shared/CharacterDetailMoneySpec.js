import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import CharacterDetail from '../../../../../../../../assets/js/components/resources/character/pages/shared/CharacterDetail.jsx';
import CharacterHelper from '../../../../../../../../assets/js/components/resources/character/pages/helpers/CharacterHelper.jsx';
import MoneyEditModalHelper
  from '../../../../../../../../assets/js/components/common/helpers/MoneyEditModalHelper.jsx';
import AuthStorage from '../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';

const loadedCharacter = {
  id: 5, can_edit: true, can_edit_money: true, money: 310, game_type: 'dnd', is_pc: true, game_slug: 'demo',
};

// Sets character/loading state synchronously during render (in the useMemo
// factory), so the "loaded" branch of CharacterDetail is reachable via
// renderToStaticMarkup even though useEffect never runs during SSR.
class LoadedController {
  constructor(setCharacter, setLoading) {
    setCharacter(loadedCharacter);
    setLoading(false);
  }

  buildEffect() { return () => Noop.noop; }
  // eslint-disable-next-line no-unused-vars
  updateCharacterMoney(gameSlug, characterId, token, money) { return Promise.resolve({ ok: true }); }
}

describe('CharacterDetail money modal', function() {
  let getParamsFromHash;

  beforeEach(function() {
    getParamsFromHash = jasmine.createSpy('getParamsFromHash').and.returnValue({
      game_slug: 'demo',
      character_id: '5',
    });
  });

  it('renders the money modal initially closed', function() {
    spyOn(CharacterHelper, 'render').and.returnValue(null);
    let capturedShow;
    spyOn(MoneyEditModalHelper, 'render').and.callFake((show) => {
      capturedShow = show;
      return null;
    });

    renderToStaticMarkup(
      React.createElement(CharacterDetail, {
        ControllerClass: LoadedController,
        getParamsFromHash,
        characterKind: 'pcs',
      })
    );

    expect(capturedShow).toBe(false);
  });

  it('opens the money modal via onOpenMoneyModal', function() {
    let capturedHandlers;
    spyOn(CharacterHelper, 'render').and.callFake((character, backHref, handlers) => {
      capturedHandlers = handlers;
      return null;
    });
    spyOn(MoneyEditModalHelper, 'render').and.returnValue(null);

    renderToStaticMarkup(
      React.createElement(CharacterDetail, {
        ControllerClass: LoadedController,
        getParamsFromHash,
        characterKind: 'pcs',
      })
    );

    expect(() => capturedHandlers.onOpenMoneyModal()).not.toThrow();
  });

  it('passes the character context/gameType/money into the modal', function() {
    spyOn(CharacterHelper, 'render').and.returnValue(null);
    let capturedState;
    let capturedContext;
    let capturedGameType;
    spyOn(MoneyEditModalHelper, 'render').and.callFake((show, state, handlers, context, gameType) => {
      capturedState = state;
      capturedContext = context;
      capturedGameType = gameType;
      return null;
    });

    renderToStaticMarkup(
      React.createElement(CharacterDetail, {
        ControllerClass: LoadedController,
        getParamsFromHash,
        characterKind: 'pcs',
      })
    );

    expect(capturedContext).toBe('character');
    expect(capturedGameType).toBe('dnd');
    expect(capturedState.breakdown).toBeDefined();
  });

  it('sends the total recomputed from the (unchanged) modal breakdown on confirm', function() {
    spyOn(AuthStorage, 'getToken').and.returnValue('auth-tok');
    spyOn(LoadedController.prototype, 'updateCharacterMoney').and.returnValue(Promise.resolve({ ok: true }));
    let capturedHandlers;
    spyOn(CharacterHelper, 'render').and.returnValue(null);
    spyOn(MoneyEditModalHelper, 'render').and.callFake((show, state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });

    renderToStaticMarkup(
      React.createElement(CharacterDetail, {
        ControllerClass: LoadedController,
        getParamsFromHash,
        characterKind: 'pcs',
      })
    );

    // MoneyEditModal recomputes the total from its own local breakdown state
    // (seeded from character.money = 310) and ignores any argument passed
    // to its internal onConfirm handler, so the recomputed total here is 310.
    capturedHandlers.onConfirm();

    expect(LoadedController.prototype.updateCharacterMoney).toHaveBeenCalledWith('demo', 5, 'auth-tok', 310);
  });

  it('reruns buildEffect (the documented reload rule) once the save resolves', async function() {
    spyOn(AuthStorage, 'getToken').and.returnValue('auth-tok');
    spyOn(LoadedController.prototype, 'updateCharacterMoney').and.returnValue(Promise.resolve({ ok: true }));
    const buildEffectSpy = spyOn(LoadedController.prototype, 'buildEffect').and.returnValue(() => Noop.noop);
    let capturedHandlers;
    spyOn(CharacterHelper, 'render').and.returnValue(null);
    spyOn(MoneyEditModalHelper, 'render').and.callFake((show, state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });

    renderToStaticMarkup(
      React.createElement(CharacterDetail, {
        ControllerClass: LoadedController,
        getParamsFromHash,
        characterKind: 'pcs',
      })
    );

    const callsBefore = buildEffectSpy.calls.count();

    await capturedHandlers.onConfirm(500);

    expect(buildEffectSpy.calls.count()).toBe(callsBefore + 1);
  });

  it('does not throw when the money modal is closed or confirmed', function() {
    spyOn(AuthStorage, 'getToken').and.returnValue('auth-tok');
    spyOn(LoadedController.prototype, 'updateCharacterMoney').and.returnValue(Promise.resolve({ ok: true }));
    let capturedHandlers;
    spyOn(CharacterHelper, 'render').and.returnValue(null);
    spyOn(MoneyEditModalHelper, 'render').and.callFake((show, state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });

    renderToStaticMarkup(
      React.createElement(CharacterDetail, {
        ControllerClass: LoadedController,
        getParamsFromHash,
        characterKind: 'pcs',
      })
    );

    expect(() => {
      capturedHandlers.onClose();
      capturedHandlers.onConfirm(500);
    }).not.toThrow();
  });
});
