import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import CharacterEdit from '../../../../../../../../assets/js/components/resources/character/pages/shared/CharacterEdit.jsx';
import PcCharacterEditHelper
  from '../../../../../../../../assets/js/components/resources/character/pages/helpers/PcCharacterEditHelper.jsx';
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
    applyLoadedCharacter() { Noop.noop(); }
    submitForm() { Noop.noop(); }
  };
}

describe('CharacterEdit access guard (broadened for PCs, issues #865/#915)', function() {
  let getParamsFromHash;
  let EditHelper;

  beforeEach(function() {
    getParamsFromHash = jasmine.createSpy('getParamsFromHash').and.returnValue({
      game_slug: 'demo',
      character_id: '1',
    });
    EditHelper = PcCharacterEditHelper;
  });

  it('renders the edit form (not the loading state) for a PC player who is not a full editor', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterEdit, {
        ControllerClass: buildController({ can_edit: false, is_player: true, is_pc: true }),
        getParamsFromHash,
        EditHelper,
        characterKind: 'pcs',
      })
    );

    expect(html).not.toContain('Loading');
  });

  it('renders the edit form (not the loading state) for a Staff account on a PC', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterEdit, {
        ControllerClass: buildController({
          can_edit: false, is_player: false, is_pc: true, is_staff: true,
        }),
        getParamsFromHash,
        EditHelper,
        characterKind: 'pcs',
      })
    );

    expect(html).not.toContain('Loading');
  });

  it('renders the loading state for a PC visitor who is neither a player nor Staff', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterEdit, {
        ControllerClass: buildController({
          can_edit: false, is_player: false, is_pc: true, is_staff: false,
        }),
        getParamsFromHash,
        EditHelper,
        characterKind: 'pcs',
      })
    );

    expect(html).toContain('Loading');
  });

  it('passes canEditMoney: true into EditHelper.render for a full editor', function() {
    let captured;
    spyOn(EditHelper, 'render').and.callFake((state, handlers) => {
      captured = { state, handlers };
      return null;
    });

    renderToStaticMarkup(
      React.createElement(CharacterEdit, {
        ControllerClass: buildController({
          can_edit: true, is_player: true, is_pc: true,
        }),
        getParamsFromHash,
        EditHelper,
        characterKind: 'pcs',
      })
    );

    expect(captured.state.canEditMoney).toBe(true);
  });

  it('passes canEditMoney: true when only is_player is true (not can_edit)', function() {
    let captured;
    spyOn(EditHelper, 'render').and.callFake((state, handlers) => {
      captured = { state, handlers };
      return null;
    });

    renderToStaticMarkup(
      React.createElement(CharacterEdit, {
        ControllerClass: buildController({
          can_edit: false, is_player: true, is_pc: true, is_staff: false,
        }),
        getParamsFromHash,
        EditHelper,
        characterKind: 'pcs',
      })
    );

    expect(captured.state.canEditMoney).toBe(true);
  });

  it('passes canEditMoney: true when only is_staff is true (not can_edit or is_player)', function() {
    let captured;
    spyOn(EditHelper, 'render').and.callFake((state, handlers) => {
      captured = { state, handlers };
      return null;
    });

    renderToStaticMarkup(
      React.createElement(CharacterEdit, {
        ControllerClass: buildController({
          can_edit: false, is_player: false, is_pc: true, is_staff: true,
        }),
        getParamsFromHash,
        EditHelper,
        characterKind: 'pcs',
      })
    );

    expect(captured.state.canEditMoney).toBe(true);
  });
});
