import ResilienceEvents from '../../../../assets/js/utils/ResilienceEvents.js';
import Noop from '../../../../assets/js/utils/Noop.js';

describe('ResilienceEvents', function() {
  afterEach(function() {
    // Rebalance any counters a test may have left non-zero, so subsequent
    // specs (and other spec files sharing this module) start from 'idle'.
    while (ResilienceEvents.getStatus() !== 'idle') {
      if (ResilienceEvents.getStatus() === 'retrying') {
        ResilienceEvents.retryAttempting();
      } else {
        ResilienceEvents.requestSucceeded();
      }
    }
  });

  describe('.getStatus', function() {
    it('returns idle when nothing is in flight or retrying', function() {
      expect(ResilienceEvents.getStatus()).toBe('idle');
    });

    it('returns requesting while a request is in flight', function() {
      ResilienceEvents.requestStarted();

      expect(ResilienceEvents.getStatus()).toBe('requesting');

      ResilienceEvents.requestSucceeded();
    });

    it('returns idle again once the in-flight request finishes', function() {
      ResilienceEvents.requestStarted();
      ResilienceEvents.requestSucceeded();

      expect(ResilienceEvents.getStatus()).toBe('idle');
    });

    it('returns retrying while a retry is scheduled', function() {
      ResilienceEvents.requestStarted();
      ResilienceEvents.retryScheduled();

      expect(ResilienceEvents.getStatus()).toBe('retrying');

      ResilienceEvents.retryAttempting();
      ResilienceEvents.requestSucceeded();
    });

    it('returns requesting again once the retry is attempted', function() {
      ResilienceEvents.requestStarted();
      ResilienceEvents.retryScheduled();
      ResilienceEvents.retryAttempting();

      expect(ResilienceEvents.getStatus()).toBe('requesting');

      ResilienceEvents.requestSucceeded();
    });

    it('prioritizes retrying over requesting when both are non-zero', function() {
      ResilienceEvents.requestStarted();
      ResilienceEvents.requestStarted();
      ResilienceEvents.retryScheduled();

      expect(ResilienceEvents.getStatus()).toBe('retrying');

      ResilienceEvents.retryAttempting();
      ResilienceEvents.requestSucceeded();
      ResilienceEvents.requestSucceeded();
    });

    it('never goes below idle when finishing more requests than started', function() {
      ResilienceEvents.requestSucceeded();

      expect(ResilienceEvents.getStatus()).toBe('idle');
    });
  });

  describe('.emit (via requestStarted)', function() {
    it('does not throw when window is unavailable', function() {
      expect(() => ResilienceEvents.requestStarted()).not.toThrow();
      ResilienceEvents.requestSucceeded();
    });
  });

  describe('.subscribe', function() {
    it('does not throw when window is unavailable', function() {
      expect(() => ResilienceEvents.subscribe(Noop.noop)).not.toThrow();
    });
  });

  describe('.unsubscribe', function() {
    it('does not throw when window is unavailable', function() {
      expect(() => ResilienceEvents.unsubscribe(Noop.noop)).not.toThrow();
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

    it('notifies subscribers with the current status on a change', function() {
      const handler = jasmine.createSpy('handler');
      ResilienceEvents.subscribe(handler);

      ResilienceEvents.requestStarted();

      expect(handler).toHaveBeenCalledWith(jasmine.objectContaining({ detail: { status: 'requesting' } }));

      ResilienceEvents.requestSucceeded();
    });

    it('stops notifying once unsubscribed', function() {
      const handler = jasmine.createSpy('handler');
      ResilienceEvents.subscribe(handler);
      ResilienceEvents.unsubscribe(handler);

      ResilienceEvents.requestStarted();

      expect(handler).not.toHaveBeenCalled();

      ResilienceEvents.requestSucceeded();
    });
  });
});
