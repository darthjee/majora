import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import CharacterEdit from '../../../../../../../../assets/js/components/resources/character/pages/shared/CharacterEdit.jsx';
import BaseCharacterEditHelper
  from '../../../../../../../../assets/js/components/resources/character/pages/helpers/BaseCharacterEditHelper.jsx';
import MoneyEditModalHelper
  from '../../../../../../../../assets/js/components/resources/character/pages/elements/helpers/MoneyEditModalHelper.jsx';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';

// Sets character/loading state synchronously during render (in the useMemo
// factory), so the "loaded" branch of CharacterEdit is reachable via
// renderToStaticMarkup even though useEffect never runs during SSR — this
// also means `applyLoadedCharacter` (invoked from a useEffect in
// CharacterEdit.jsx) never actually runs here; that seeding behavior is
// covered directly by BaseCharacterEditController's applyLoadedCharacterSpec.
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

describe('CharacterEdit money modal', function() {
  let getParamsFromHash;
  let EditHelper;

  beforeEach(function() {
    getParamsFromHash = jasmine.createSpy('getParamsFromHash').and.returnValue({
      game_slug: 'demo',
      character_id: '1',
    });
    EditHelper = new BaseCharacterEditHelper('test', 'npc_edit_page');
  });

  it('renders the money modal initially closed', function() {
    let capturedShow;
    spyOn(EditHelper, 'render').and.returnValue(null);
    spyOn(MoneyEditModalHelper, 'render').and.callFake((show) => {
      capturedShow = show;
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

    expect(capturedShow).toBe(false);
  });

  it('opens the money modal via onOpenMoneyModal without throwing', function() {
    let capturedHandlers;
    spyOn(EditHelper, 'render').and.callFake((state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });
    spyOn(MoneyEditModalHelper, 'render').and.returnValue(null);

    renderToStaticMarkup(
      React.createElement(CharacterEdit, {
        ControllerClass: LoadedController,
        getParamsFromHash,
        EditHelper,
        characterKind: 'npcs',
      })
    );

    expect(() => capturedHandlers.onOpenMoneyModal()).not.toThrow();
  });

  it('seeds the money modal breakdown from the current (empty) money state', function() {
    let capturedEditHelperState;
    let capturedMoneyModalState;
    spyOn(EditHelper, 'render').and.callFake((state) => {
      capturedEditHelperState = state;
      return null;
    });
    spyOn(MoneyEditModalHelper, 'render').and.callFake((show, state) => {
      capturedMoneyModalState = state;
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

    expect(capturedEditHelperState.money).toBe('');
    expect(capturedMoneyModalState.breakdown).toEqual({
      cp: 0, sp: 0, gp: 0, pp: 0, gems: 0,
    });
  });

  it('does not throw when the money modal is closed or confirmed', function() {
    let capturedMoneyModalHandlers;
    spyOn(EditHelper, 'render').and.returnValue(null);
    spyOn(MoneyEditModalHelper, 'render').and.callFake((show, state, handlers) => {
      capturedMoneyModalHandlers = handlers;
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

    expect(() => {
      capturedMoneyModalHandlers.onClose();
      capturedMoneyModalHandlers.onConfirm(500);
    }).not.toThrow();
  });
});
