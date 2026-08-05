import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameEdit from '../../../../../../../assets/js/components/resources/game/pages/GameEdit.jsx';
import GameEditHelper from '../../../../../../../assets/js/components/resources/game/pages/helpers/GameEditHelper.jsx';
import LinksEditModalHelper
  from '../../../../../../../assets/js/components/common/modals/helpers/LinksEditModalHelper.jsx';
import Noop from '../../../../../../../assets/js/utils/Noop.js';
import { buildGame, buildLink } from '../../../../../../support/factories.js';

// Sets game/loading state synchronously during render (in the useMemo factory), so the "loaded"
// branch of GameEdit is reachable via renderToStaticMarkup even though useEffect never runs
// during SSR — this also means GameEdit's own seeding effect (fields/links state, from `game`)
// never actually runs here, so `links`/`fields` stay at their initial empty values; the wiring
// under test (links state flowing into both GameEditHelper.render and LinksEditModal, the modal's
// initial visibility, and its handlers) is unaffected by that.
class LoadedController {
  constructor(setGame, setLoading) {
    setGame(buildGame({ can_edit: true, is_player: false, is_staff: false }));
    setLoading(false);
  }

  buildEffect() { return () => Noop.noop; }
  // eslint-disable-next-line no-empty-function
  submitForm() {}
}

describe('GameEdit links modal', function() {
  it('passes the same (unfiltered) links state into both GameEditHelper.render and LinksEditModal', function() {
    let capturedEditHelperState;
    let capturedModalState;
    spyOn(GameEditHelper, 'render').and.callFake((state) => {
      capturedEditHelperState = state;
      return null;
    });
    spyOn(LinksEditModalHelper, 'render').and.callFake((show, state) => {
      capturedModalState = state;
      return null;
    });

    renderToStaticMarkup(React.createElement(GameEdit, { ControllerClass: LoadedController }));

    expect(capturedEditHelperState.links).toEqual(capturedModalState.links);
  });

  it('renders the links modal initially closed', function() {
    let capturedShow;
    spyOn(GameEditHelper, 'render').and.returnValue(null);
    spyOn(LinksEditModalHelper, 'render').and.callFake((show) => {
      capturedShow = show;
      return null;
    });

    renderToStaticMarkup(React.createElement(GameEdit, { ControllerClass: LoadedController }));

    expect(capturedShow).toBe(false);
  });

  it('opens the links modal via onOpenLinksModal without throwing', function() {
    let capturedHandlers;
    spyOn(GameEditHelper, 'render').and.callFake((state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });
    spyOn(LinksEditModalHelper, 'render').and.returnValue(null);

    renderToStaticMarkup(React.createElement(GameEdit, { ControllerClass: LoadedController }));

    expect(() => capturedHandlers.onOpenLinksModal()).not.toThrow();
  });

  it('does not throw when the links modal is closed or confirmed', function() {
    let capturedLinksHandlers;
    spyOn(GameEditHelper, 'render').and.returnValue(null);
    spyOn(LinksEditModalHelper, 'render').and.callFake((show, state, handlers) => {
      capturedLinksHandlers = handlers;
      return null;
    });

    renderToStaticMarkup(React.createElement(GameEdit, { ControllerClass: LoadedController }));

    expect(() => {
      capturedLinksHandlers.onClose();
      capturedLinksHandlers.onConfirm([buildLink({ id: 3 })]);
    }).not.toThrow();
  });

  it('forwards a links key as part of the formValues passed to submitForm', function() {
    const submitFormSpy = spyOn(LoadedController.prototype, 'submitForm');
    let capturedHandlers;
    spyOn(GameEditHelper, 'render').and.callFake((state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });
    spyOn(LinksEditModalHelper, 'render').and.returnValue(null);

    renderToStaticMarkup(React.createElement(GameEdit, { ControllerClass: LoadedController }));

    capturedHandlers.onSubmit({ preventDefault: Noop.noop });

    expect(submitFormSpy).toHaveBeenCalled();

    const formValues = submitFormSpy.calls.mostRecent().args[2];

    expect(formValues.links).toEqual([]);
  });

  it('passes isFullEditor through as part of the form state', function() {
    let capturedEditHelperState;
    spyOn(GameEditHelper, 'render').and.callFake((state) => {
      capturedEditHelperState = state;
      return null;
    });
    spyOn(LinksEditModalHelper, 'render').and.returnValue(null);

    renderToStaticMarkup(React.createElement(GameEdit, { ControllerClass: LoadedController }));

    expect(capturedEditHelperState.isFullEditor).toBe(true);
  });
});
