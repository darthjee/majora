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
    // eslint-disable-next-line no-empty-function
    applyLoadedCharacter() {}
    // eslint-disable-next-line no-empty-function
    submitForm() {}
  };
}

describe('CharacterEdit access guard (broadened for PCs, issue #865)', function() {
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

  it('passes canEditMoney (character.can_edit) into EditHelper.render', function() {
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
});
