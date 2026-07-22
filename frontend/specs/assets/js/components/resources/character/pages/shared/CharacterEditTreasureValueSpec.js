import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import CharacterEdit from '../../../../../../../../assets/js/components/resources/character/pages/shared/CharacterEdit.jsx';
import NpcCharacterEditHelper
  from '../../../../../../../../assets/js/components/resources/character/pages/helpers/NpcCharacterEditHelper.jsx';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';

class LoadedController {
  constructor(setCharacter, setLoading) {
    setCharacter({ can_edit: true, treasure_value: 2000 });
    setLoading(false);
  }

  buildEffect() { return () => Noop.noop; }
  // eslint-disable-next-line no-empty-function
  applyLoadedCharacter() {}
  // eslint-disable-next-line no-empty-function
  submitForm() {}
}

class NoTreasureLoadedController {
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

describe('CharacterEdit treasure value', function() {
  let getParamsFromHash;
  let EditHelper;

  beforeEach(function() {
    getParamsFromHash = jasmine.createSpy('getParamsFromHash').and.returnValue({
      game_slug: 'demo',
      character_id: '1',
    });
    EditHelper = NpcCharacterEditHelper;
  });

  it('passes character.treasure_value through to the edit helper state', function() {
    let capturedState;
    spyOn(EditHelper, 'render').and.callFake((state) => {
      capturedState = state;
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

    expect(capturedState.treasureValue).toBe(2000);
  });

  it('defaults treasureValue to 0 when the character has no treasure_value', function() {
    let capturedState;
    spyOn(EditHelper, 'render').and.callFake((state) => {
      capturedState = state;
      return null;
    });

    renderToStaticMarkup(
      React.createElement(CharacterEdit, {
        ControllerClass: NoTreasureLoadedController,
        getParamsFromHash,
        EditHelper,
        characterKind: 'npcs',
      })
    );

    expect(capturedState.treasureValue).toBe(0);
  });
});
