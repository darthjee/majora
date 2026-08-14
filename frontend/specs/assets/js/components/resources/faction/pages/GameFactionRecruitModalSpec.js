import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameFaction from '../../../../../../../assets/js/components/resources/faction/pages/GameFaction.jsx';
import FactionDetailHelper
  from '../../../../../../../assets/js/components/resources/faction/pages/helpers/FactionDetailHelper.jsx';
import RecruitModalHelper
  from '../../../../../../../assets/js/components/resources/faction/pages/elements/helpers/RecruitModalHelper.jsx';
import RecruitModalController
  from '../../../../../../../assets/js/components/resources/faction/pages/elements/controllers/RecruitModalController.js';
import RequestStore from '../../../../../../../assets/js/utils/requests/RequestStore.js';
import Noop from '../../../../../../../assets/js/utils/Noop.js';

const loadedFaction = { id: 5, name: 'The Silver Hand' };

/** Stub controller that synchronously loads a faction (with upload/edit permission) during construction. */
class LoadedController {
  constructor(setFaction, setLoading, setError, setCanEdit, setCanUploadPhoto, setCanRecruitHidden) {
    setFaction(loadedFaction);
    setCanEdit(true);
    setCanUploadPhoto(true);
    setCanRecruitHidden(false);
    setLoading(false);
  }

  buildEffect() { return () => Noop.noop; }
}

/** Stub controller that synchronously loads a faction with recruit-hidden permission (dm/admin). */
class LoadedWithRecruitHiddenController {
  constructor(setFaction, setLoading, setError, setCanEdit, setCanUploadPhoto, setCanRecruitHidden) {
    setFaction(loadedFaction);
    setCanEdit(true);
    setCanUploadPhoto(true);
    setCanRecruitHidden(true);
    setLoading(false);
  }

  buildEffect() { return () => Noop.noop; }
}

describe('GameFaction recruit modal (issue #943)', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/factions/5' } };
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('wires canRecruitHidden through to the recruit modal\'s submit call', async function() {
    spyOn(FactionDetailHelper, 'render').and.returnValue(null);
    let capturedHandlers;
    spyOn(RecruitModalHelper, 'render').and.callFake((show, state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });
    spyOn(RecruitModalController.prototype, 'submit').and.returnValue(Promise.resolve());

    renderToStaticMarkup(
      React.createElement(GameFaction, { ControllerClass: LoadedWithRecruitHiddenController }),
    );

    await capturedHandlers.onSubmit();

    expect(RecruitModalController.prototype.submit).toHaveBeenCalledWith(
      [], 'demo', loadedFaction.id, true, jasmine.any(Object),
    );
  });

  it('passes onRecruitClick to FactionDetailHelper, opening the recruit modal', function() {
    let capturedOnRecruitClick;
    spyOn(FactionDetailHelper, 'render').and.callFake((
      faction, backHref, editHref, canEdit, canUploadPhoto, onUploadClick, gameSlug, refreshToken, onRecruitClick,
    ) => {
      capturedOnRecruitClick = onRecruitClick;
      return null;
    });
    let capturedShow;
    spyOn(RecruitModalHelper, 'render').and.callFake((show) => {
      capturedShow = show;
      return null;
    });

    renderToStaticMarkup(React.createElement(GameFaction, { ControllerClass: LoadedController }));

    expect(capturedShow).toBe(false);
    expect(() => capturedOnRecruitClick()).not.toThrow();
  });

  it('purges the faction cache after a successful recruit submit', async function() {
    spyOn(FactionDetailHelper, 'render').and.returnValue(null);
    spyOn(RequestStore, 'purge');
    let capturedHandlers;
    spyOn(RecruitModalHelper, 'render').and.callFake((show, state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });
    spyOn(RecruitModalController.prototype, 'submit').and.returnValue(Promise.resolve());

    renderToStaticMarkup(React.createElement(GameFaction, { ControllerClass: LoadedController }));

    await capturedHandlers.onSubmit();

    expect(RequestStore.purge).toHaveBeenCalledWith({ resource: 'faction' });
  });

  it('closes the recruit modal without throwing when onClose is invoked', function() {
    spyOn(FactionDetailHelper, 'render').and.returnValue(null);
    let capturedHandlers;
    spyOn(RecruitModalHelper, 'render').and.callFake((show, state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });

    renderToStaticMarkup(React.createElement(GameFaction, { ControllerClass: LoadedController }));

    expect(() => capturedHandlers.onClose()).not.toThrow();
  });
});
