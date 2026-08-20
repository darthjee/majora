import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import useHeaderAuthEffect, { buildAuthEffect }
  from '../../../../../../../assets/js/components/common/header/hooks/useHeaderAuthEffect.js';
import AuthEvents from '../../../../../../../assets/js/utils/auth/AuthEvents.js';
import AccessEvents from '../../../../../../../assets/js/utils/access/AccessEvents.js';
import AccessStore from '../../../../../../../assets/js/utils/access/store/AccessStore.js';
import Noop from '../../../../../../../assets/js/utils/Noop.js';

/**
 * Minimal component exercising `useHeaderAuthEffect`, used to assert the hook can be called
 * from a real component body without violating the rules of hooks.
 *
 * @param {object} props - Component props.
 * @param {object} props.params - Params passed through to the hook.
 * @returns {React.ReactElement} A trivial element.
 */
function TestHost({ params }) {
  useHeaderAuthEffect(params);
  return React.createElement('div', null, 'ok');
}

/**
 * Builds a fresh set of spies used to construct `buildAuthEffect`'s params.
 *
 * @returns {object} the controller/viewAsController spies and a fresh `lastLoggedInRef`.
 */
function buildParams() {
  const cleanupRoute = jasmine.createSpy('cleanupRoute');
  const controller = jasmine.createSpyObj('controller', ['checkStatus', 'setLoggedIn', 'recheckAuthState', 'buildRouteEffect']);
  controller.checkStatus.and.returnValue(Promise.resolve({ isSuperUser: true, isStaff: false }));
  controller.recheckAuthState.and.returnValue(Promise.resolve());
  controller.buildRouteEffect.and.returnValue(() => cleanupRoute);

  const viewAsController = jasmine.createSpyObj('viewAsController', ['checkAvailability']);
  viewAsController.checkAvailability.and.returnValue(Promise.resolve());

  const setFacadeEnabled = jasmine.createSpy('setFacadeEnabled');
  const lastLoggedInRef = { current: false };

  return {
    controller, viewAsController, setFacadeEnabled, lastLoggedInRef, cleanupRoute,
  };
}

describe('useHeaderAuthEffect', function() {
  it('does not throw when called from a component body', function() {
    const params = {
      controller: jasmine.createSpyObj('controller', ['checkStatus', 'setLoggedIn', 'recheckAuthState', 'buildRouteEffect']),
      viewAsController: jasmine.createSpyObj('viewAsController', ['checkAvailability']),
      setFacadeEnabled: jasmine.createSpy('setFacadeEnabled'),
      loggedIn: false,
    };
    params.controller.checkStatus.and.returnValue(Promise.resolve({}));
    params.controller.buildRouteEffect.and.returnValue(() => Noop.noop);

    expect(() => renderToStaticMarkup(React.createElement(TestHost, { params }))).not.toThrow();
  });
});

describe('buildAuthEffect', function() {
  it('checks the auth status and the view-as availability on start', async function() {
    const { controller, viewAsController, setFacadeEnabled, lastLoggedInRef } = buildParams();

    buildAuthEffect({
      controller, viewAsController, setFacadeEnabled, lastLoggedInRef,
    })();
    await Promise.resolve();
    await Promise.resolve();

    expect(controller.checkStatus).toHaveBeenCalled();
    expect(viewAsController.checkAvailability).toHaveBeenCalledWith(true, false);
  });

  it('starts the controller-owned route effect', function() {
    const { controller, viewAsController, setFacadeEnabled, lastLoggedInRef } = buildParams();

    buildAuthEffect({
      controller, viewAsController, setFacadeEnabled, lastLoggedInRef,
    })();

    expect(controller.buildRouteEffect).toHaveBeenCalled();
  });

  describe('AuthEvents subscription', function() {
    let controller, viewAsController, setFacadeEnabled, lastLoggedInRef, handleAuthChanged;

    beforeEach(function() {
      ({ controller, viewAsController, setFacadeEnabled, lastLoggedInRef } = buildParams());
      spyOn(AuthEvents, 'subscribe');
      spyOn(AuthEvents, 'unsubscribe');

      buildAuthEffect({
        controller, viewAsController, setFacadeEnabled, lastLoggedInRef,
      })();
      ([handleAuthChanged] = AuthEvents.subscribe.calls.mostRecent().args);
    });

    it('always forwards the new logged-in value to the controller', function() {
      handleAuthChanged({ detail: { loggedIn: false } });

      expect(controller.setLoggedIn).toHaveBeenCalledWith(false);
      expect(controller.recheckAuthState).not.toHaveBeenCalled();
    });

    it('re-checks auth state on a genuine logged-in transition', function() {
      handleAuthChanged({ detail: { loggedIn: true } });

      expect(controller.setLoggedIn).toHaveBeenCalledWith(true);
      expect(controller.recheckAuthState).toHaveBeenCalledWith(viewAsController);
      expect(lastLoggedInRef.current).toBe(true);
    });

    it('does not re-check auth state when the logged-in value does not change', function() {
      lastLoggedInRef.current = true;

      handleAuthChanged({ detail: { loggedIn: true } });

      expect(controller.recheckAuthState).not.toHaveBeenCalled();
    });
  });

  describe('AccessEvents facade subscription', function() {
    it('updates facadeEnabled from AccessStore when the facade changes', function() {
      const { controller, viewAsController, setFacadeEnabled, lastLoggedInRef } = buildParams();
      spyOn(AccessEvents, 'subscribeFacadeChanged');
      spyOn(AccessStore, 'getFacade').and.returnValue({ enabled: true });

      buildAuthEffect({
        controller, viewAsController, setFacadeEnabled, lastLoggedInRef,
      })();
      const [handleFacadeChanged] = AccessEvents.subscribeFacadeChanged.calls.mostRecent().args;
      handleFacadeChanged();

      expect(setFacadeEnabled).toHaveBeenCalledWith(true);
    });
  });

  describe('cleanup', function() {
    it('unsubscribes from AuthEvents/AccessEvents and cleans up the route effect', function() {
      const { controller, viewAsController, setFacadeEnabled, lastLoggedInRef, cleanupRoute } = buildParams();
      spyOn(AuthEvents, 'subscribe');
      spyOn(AuthEvents, 'unsubscribe');
      spyOn(AccessEvents, 'subscribeFacadeChanged');
      spyOn(AccessEvents, 'unsubscribeFacadeChanged');

      const cleanup = buildAuthEffect({
        controller, viewAsController, setFacadeEnabled, lastLoggedInRef,
      })();
      const [handleAuthChanged] = AuthEvents.subscribe.calls.mostRecent().args;
      const [handleFacadeChanged] = AccessEvents.subscribeFacadeChanged.calls.mostRecent().args;

      cleanup();

      expect(AuthEvents.unsubscribe).toHaveBeenCalledWith(handleAuthChanged);
      expect(AccessEvents.unsubscribeFacadeChanged).toHaveBeenCalledWith(handleFacadeChanged);
      expect(cleanupRoute).toHaveBeenCalled();
    });
  });
});
