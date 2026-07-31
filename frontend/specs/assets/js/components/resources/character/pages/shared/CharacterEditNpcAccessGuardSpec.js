import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import CharacterEdit from '../../../../../../../../assets/js/components/resources/character/pages/shared/CharacterEdit.jsx';
import NpcCharacterEditHelper
  from '../../../../../../../../assets/js/components/resources/character/pages/helpers/NpcCharacterEditHelper.jsx';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';

// Sets character/loading state synchronously during render (in the useMemo
// factory), so the "loaded" branch of CharacterEdit is reachable via
// renderToStaticMarkup even though useEffect never runs during SSR.
function buildController(character) {
  return class LoadedController {
    constructor(setCharacter, setLoading) {
      setCharacter(character);
      setLoading(false);
    }

    buildEffect() { return () => Noop.noop; }
    // eslint-disable-next-line no-empty-function
    applyLoadedCharacter() {}
    // eslint-disable-next-line no-empty-function
    submitForm() {}
  };
}

describe('CharacterEdit access guard (broadened for NPCs, issue #915)', function() {
  let getParamsFromHash;
  let EditHelper;

  beforeEach(function() {
    getParamsFromHash = jasmine.createSpy('getParamsFromHash').and.returnValue({
      game_slug: 'demo',
      character_id: '1',
    });
    EditHelper = NpcCharacterEditHelper;
  });

  it('renders the edit form (not the loading state) for an NPC player who is not a full editor', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterEdit, {
        ControllerClass: buildController({ can_edit: false, is_player: true, is_pc: false }),
        getParamsFromHash,
        EditHelper,
        characterKind: 'npcs',
      })
    );

    expect(html).not.toContain('Loading');
  });

  it('renders the edit form (not the loading state) for a Staff account on an NPC', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterEdit, {
        ControllerClass: buildController({
          can_edit: false, is_player: false, is_pc: false, is_staff: true,
        }),
        getParamsFromHash,
        EditHelper,
        characterKind: 'npcs',
      })
    );

    expect(html).not.toContain('Loading');
  });

  it('renders the loading state for an NPC visitor who is neither a player nor Staff', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterEdit, {
        ControllerClass: buildController({
          can_edit: false, is_player: false, is_pc: false, is_staff: false,
        }),
        getParamsFromHash,
        EditHelper,
        characterKind: 'npcs',
      })
    );

    expect(html).toContain('Loading');
  });

  it('passes canEditMoney: true into EditHelper.render for an NPC player who is not a full editor', function() {
    let captured;
    spyOn(EditHelper, 'render').and.callFake((state, handlers) => {
      captured = { state, handlers };
      return null;
    });

    renderToStaticMarkup(
      React.createElement(CharacterEdit, {
        ControllerClass: buildController({
          can_edit: false, is_player: true, is_pc: false, is_staff: false,
        }),
        getParamsFromHash,
        EditHelper,
        characterKind: 'npcs',
      })
    );

    expect(captured.state.canEditMoney).toBe(true);
  });

  it('passes canEditMoney: true into EditHelper.render for a Staff account on an NPC', function() {
    let captured;
    spyOn(EditHelper, 'render').and.callFake((state, handlers) => {
      captured = { state, handlers };
      return null;
    });

    renderToStaticMarkup(
      React.createElement(CharacterEdit, {
        ControllerClass: buildController({
          can_edit: false, is_player: false, is_pc: false, is_staff: true,
        }),
        getParamsFromHash,
        EditHelper,
        characterKind: 'npcs',
      })
    );

    expect(captured.state.canEditMoney).toBe(true);
  });
});
