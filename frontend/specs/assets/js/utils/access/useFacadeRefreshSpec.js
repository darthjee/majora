import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import FacadeRefresh, { subscribe } from '../../../../../assets/js/utils/access/useFacadeRefresh.js';
import AccessEvents from '../../../../../assets/js/utils/access/AccessEvents.js';
import Noop from '../../../../../assets/js/utils/Noop.js';

/**
 * Minimal component exercising `FacadeRefresh.useFacadeRefresh`, used to
 * assert the hook can be called from a real component body without
 * violating the rules of hooks.
 *
 * @param {object} props - Component props.
 * @param {object} props.controller - Controller passed through to the hook.
 * @returns {React.ReactElement} A trivial element.
 */
function TestHost({ controller }) {
  FacadeRefresh.useFacadeRefresh(controller);
  return React.createElement('div', null, 'ok');
}

describe('FacadeRefresh', function() {
  describe('.useFacadeRefresh', function() {
    it('does not throw when called from a component body', function() {
      const controller = { buildEffect: () => Noop.noop };

      expect(() => renderToStaticMarkup(React.createElement(TestHost, { controller }))).not.toThrow();
    });
  });

  describe('.subscribe', function() {
    it('installs a handler that re-runs the controller effect when the facade changes', function() {
      const rerun = jasmine.createSpy('rerun');
      const controller = { buildEffect: () => rerun };
      spyOn(AccessEvents, 'subscribeFacadeChanged');

      subscribe(controller);

      const [handler] = AccessEvents.subscribeFacadeChanged.calls.mostRecent().args;
      handler();

      expect(rerun).toHaveBeenCalled();
    });

    it('returns an unsubscribe function delegating to AccessEvents.unsubscribeFacadeChanged', function() {
      const controller = { buildEffect: () => Noop.noop };
      spyOn(AccessEvents, 'subscribeFacadeChanged');
      spyOn(AccessEvents, 'unsubscribeFacadeChanged');

      const unsubscribe = subscribe(controller);
      const [handler] = AccessEvents.subscribeFacadeChanged.calls.mostRecent().args;
      unsubscribe();

      expect(AccessEvents.unsubscribeFacadeChanged).toHaveBeenCalledWith(handler);
    });

    describe('end-to-end through a real AccessEvents.emitFacadeChanged dispatch', function() {
      let fakeWindow;

      beforeEach(function() {
        fakeWindow = {
          listeners: {},
          addEventListener(name, handler) {
            this.listeners[name] = handler;
          },
          removeEventListener(name, handler) {
            if (this.listeners[name] === handler) {
              delete this.listeners[name];
            }
          },
          dispatchEvent(event) {
            this.listeners[event.type]?.(event);
          },
        };
        globalThis.window = fakeWindow;
        globalThis.CustomEvent = class CustomEvent {
          constructor(type) {
            this.type = type;
          }
        };
      });

      afterEach(function() {
        delete globalThis.window;
        delete globalThis.CustomEvent;
      });

      it('re-runs the controller effect when the facade changes', function() {
        const rerun = jasmine.createSpy('rerun');
        const controller = { buildEffect: () => rerun };

        subscribe(controller);
        AccessEvents.emitFacadeChanged();

        expect(rerun).toHaveBeenCalled();
      });

      it('stops re-running the controller effect once unsubscribed', function() {
        const rerun = jasmine.createSpy('rerun');
        const controller = { buildEffect: () => rerun };

        const unsubscribe = subscribe(controller);
        unsubscribe();
        AccessEvents.emitFacadeChanged();

        expect(rerun).not.toHaveBeenCalled();
      });
    });
  });
});
