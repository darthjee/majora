import AccessEvents from '../../../../../assets/js/utils/access/AccessEvents.js';
import Noop from '../../../../../assets/js/utils/Noop.js';

describe('AccessEvents', function() {
  describe('.emit', function() {
    it('does not throw when window is unavailable', function() {
      expect(() => AccessEvents.emit({ key: 'game:demo' })).not.toThrow();
    });
  });

  describe('.subscribe', function() {
    it('does not throw when window is unavailable', function() {
      expect(() => AccessEvents.subscribe(Noop.noop)).not.toThrow();
    });
  });

  describe('.unsubscribe', function() {
    it('does not throw when window is unavailable', function() {
      expect(() => AccessEvents.unsubscribe(Noop.noop)).not.toThrow();
    });
  });

  describe('when window is available', function() {
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
        constructor(type, { detail } = {}) {
          this.type = type;
          this.detail = detail;
        }
      };
    });

    afterEach(function() {
      delete globalThis.window;
      delete globalThis.CustomEvent;
    });

    it('notifies subscribers with the emitted detail', function() {
      const handler = jasmine.createSpy('handler');
      AccessEvents.subscribe(handler);

      AccessEvents.emit({ key: 'game:demo' });

      expect(handler).toHaveBeenCalledWith(jasmine.objectContaining({ detail: { key: 'game:demo' } }));
    });

    it('stops notifying once unsubscribed', function() {
      const handler = jasmine.createSpy('handler');
      AccessEvents.subscribe(handler);
      AccessEvents.unsubscribe(handler);

      AccessEvents.emit({ key: 'game:demo' });

      expect(handler).not.toHaveBeenCalled();
    });
  });
});
