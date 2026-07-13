import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import CharacterEdit from '../../../../../../../../assets/js/components/resources/character/pages/shared/CharacterEdit.jsx';
import BaseCharacterEditHelper
  from '../../../../../../../../assets/js/components/resources/character/pages/helpers/BaseCharacterEditHelper.jsx';
import LinksEditModalHelper
  from '../../../../../../../../assets/js/components/resources/character/pages/elements/helpers/LinksEditModalHelper.jsx';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';
import { buildLink } from '../../../../../../../support/factories.js';

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

describe('CharacterEdit links modal', function() {
  let getParamsFromHash;
  let EditHelper;

  beforeEach(function() {
    getParamsFromHash = jasmine.createSpy('getParamsFromHash').and.returnValue({
      game_slug: 'demo',
      character_id: '1',
    });
    EditHelper = new BaseCharacterEditHelper('test', 'npc_edit_page');
  });

  it('passes the same (unfiltered) links state into both EditHelper.render and LinksEditModal', function() {
    let capturedEditHelperState;
    let capturedModalState;
    spyOn(EditHelper, 'render').and.callFake((state) => {
      capturedEditHelperState = state;
      return null;
    });
    spyOn(LinksEditModalHelper, 'render').and.callFake((show, state) => {
      capturedModalState = state;
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

    expect(capturedEditHelperState.links).toEqual(capturedModalState.links);
  });

  it('renders the links modal initially closed', function() {
    let capturedShow;
    spyOn(EditHelper, 'render').and.returnValue(null);
    spyOn(LinksEditModalHelper, 'render').and.callFake((show) => {
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

  it('opens the links modal via onOpenLinksModal without throwing', function() {
    let capturedHandlers;
    spyOn(EditHelper, 'render').and.callFake((state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });
    spyOn(LinksEditModalHelper, 'render').and.returnValue(null);

    renderToStaticMarkup(
      React.createElement(CharacterEdit, {
        ControllerClass: LoadedController,
        getParamsFromHash,
        EditHelper,
        characterKind: 'npcs',
      })
    );

    expect(() => capturedHandlers.onOpenLinksModal()).not.toThrow();
  });

  it('does not throw when the links modal is closed or confirmed', function() {
    let capturedLinksHandlers;
    spyOn(EditHelper, 'render').and.returnValue(null);
    spyOn(LinksEditModalHelper, 'render').and.callFake((show, state, handlers) => {
      capturedLinksHandlers = handlers;
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
      capturedLinksHandlers.onClose();
      capturedLinksHandlers.onConfirm([buildLink({ id: 3 })]);
    }).not.toThrow();
  });

  it('forwards a links key as part of the formValues passed to submitForm', function() {
    const submitFormSpy = spyOn(LoadedController.prototype, 'submitForm');
    let capturedHandlers;
    spyOn(EditHelper, 'render').and.callFake((state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });
    spyOn(LinksEditModalHelper, 'render').and.returnValue(null);

    renderToStaticMarkup(
      React.createElement(CharacterEdit, {
        ControllerClass: LoadedController,
        getParamsFromHash,
        EditHelper,
        characterKind: 'npcs',
      })
    );

    capturedHandlers.onSubmit({ preventDefault: Noop.noop });

    expect(submitFormSpy).toHaveBeenCalled();

    const formValues = submitFormSpy.calls.mostRecent().args[3];

    expect(formValues.links).toEqual([]);
  });
});
