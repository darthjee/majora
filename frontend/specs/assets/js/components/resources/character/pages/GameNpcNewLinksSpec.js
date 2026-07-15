import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameNpcNew from '../../../../../../../assets/js/components/resources/character/pages/GameNpcNew.jsx';
import GameNpcNewController from '../../../../../../../assets/js/components/resources/character/pages/controllers/GameNpcNewController.js';
import GameNpcNewHelper from '../../../../../../../assets/js/components/resources/character/pages/helpers/GameNpcNewHelper.jsx';
import LinksEditModalHelper
  from '../../../../../../../assets/js/components/resources/character/pages/elements/helpers/LinksEditModalHelper.jsx';
import Noop from '../../../../../../../assets/js/utils/Noop.js';
import { stubBuildEffect } from '../../../../../../support/controllerStubs.js';
import { buildLink } from '../../../../../../support/factories.js';

describe('GameNpcNew links modal', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/npcs/new' } };
    stubBuildEffect(GameNpcNewController);
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('passes the same links state into both GameNpcNewHelper.render and LinksEditModal', function() {
    let capturedHelperState;
    let capturedModalState;
    spyOn(GameNpcNewHelper, 'render').and.callFake((state) => {
      capturedHelperState = state;
      return null;
    });
    spyOn(LinksEditModalHelper, 'render').and.callFake((show, state) => {
      capturedModalState = state;
      return null;
    });

    renderToStaticMarkup(React.createElement(GameNpcNew));

    expect(capturedHelperState.links).toEqual(capturedModalState.links);
  });

  it('renders the links modal initially closed', function() {
    let capturedShow;
    spyOn(GameNpcNewHelper, 'render').and.returnValue(null);
    spyOn(LinksEditModalHelper, 'render').and.callFake((show) => {
      capturedShow = show;
      return null;
    });

    renderToStaticMarkup(React.createElement(GameNpcNew));

    expect(capturedShow).toBe(false);
  });

  it('opens the links modal via onOpenLinksModal without throwing', function() {
    let capturedHandlers;
    spyOn(GameNpcNewHelper, 'render').and.callFake((state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });
    spyOn(LinksEditModalHelper, 'render').and.returnValue(null);

    renderToStaticMarkup(React.createElement(GameNpcNew));

    expect(() => capturedHandlers.onOpenLinksModal()).not.toThrow();
  });

  it('does not throw when the links modal is closed or confirmed', function() {
    let capturedLinksHandlers;
    spyOn(GameNpcNewHelper, 'render').and.returnValue(null);
    spyOn(LinksEditModalHelper, 'render').and.callFake((show, state, handlers) => {
      capturedLinksHandlers = handlers;
      return null;
    });

    renderToStaticMarkup(React.createElement(GameNpcNew));

    expect(() => {
      capturedLinksHandlers.onClose();
      capturedLinksHandlers.onConfirm([buildLink({ id: 3 })]);
    }).not.toThrow();
  });

  it('forwards a links key as part of the formValues passed to submitForm', function() {
    const submitFormSpy = spyOn(GameNpcNewController.prototype, 'submitForm');
    let capturedHandlers;
    spyOn(GameNpcNewHelper, 'render').and.callFake((state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });
    spyOn(LinksEditModalHelper, 'render').and.returnValue(null);

    renderToStaticMarkup(React.createElement(GameNpcNew));

    capturedHandlers.onSubmit({ preventDefault: Noop.noop });

    expect(submitFormSpy).toHaveBeenCalled();

    const formValues = submitFormSpy.calls.mostRecent().args[2];

    expect(formValues.links).toEqual([]);
  });
});
