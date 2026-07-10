import AppController from '../../../../assets/js/components/AppController.js';
import LanguageEvents from '../../../../assets/js/i18n/LanguageEvents.js';
import AuthEvents from '../../../../assets/js/utils/AuthEvents.js';
import AccessStore from '../../../../assets/js/utils/AccessStore.js';
import Noop from '../../../../assets/js/utils/Noop.js';

describe('AppController', function() {
  beforeEach(function() {
    spyOn(AccessStore, 'syncForRoute');
    spyOn(AccessStore, 'syncForAuthChange');
  });

  it('resolves page from current hash', function() {
    const eventTarget = jasmine.createSpyObj('eventTarget', ['addEventListener', 'removeEventListener']);
    const controller = new AppController(Noop.noop, eventTarget, () => '#/games');
    expect(controller.getPage()).toBe('games');
  });

  it('syncs access state for the current route on mount', function() {
    const eventTarget = jasmine.createSpyObj('eventTarget', ['addEventListener', 'removeEventListener']);
    const controller = new AppController(Noop.noop, eventTarget, () => '#/games/demo');
    const cleanup = controller.buildEffect()();

    expect(AccessStore.syncForRoute).toHaveBeenCalledWith('game', '#/games/demo');

    cleanup();
  });

  it('updates page and hash on hashchange', function() {
    const setPage = jasmine.createSpy('setPage');
    const setHash = jasmine.createSpy('setHash');
    const eventTarget = jasmine.createSpyObj('eventTarget', ['addEventListener', 'removeEventListener']);

    let hash = '#/games';
    const controller = new AppController(setPage, eventTarget, () => hash, setHash);
    const cleanup = controller.buildEffect()();

    const handler = eventTarget.addEventListener.calls.mostRecent().args[1];
    hash = '#/games/demo';
    handler();

    expect(setPage).toHaveBeenCalledWith('game');
    expect(setHash).toHaveBeenCalledWith('#/games/demo');
    expect(AccessStore.syncForRoute).toHaveBeenCalledWith('game', '#/games/demo');

    cleanup();
    expect(eventTarget.removeEventListener).toHaveBeenCalled();
  });

  it('updates lang on language:changed and unsubscribes on cleanup', function() {
    const setLang = jasmine.createSpy('setLang');
    const eventTarget = jasmine.createSpyObj('eventTarget', ['addEventListener', 'removeEventListener']);
    spyOn(LanguageEvents, 'subscribe');
    spyOn(LanguageEvents, 'unsubscribe');

    const controller = new AppController(Noop.noop, eventTarget, () => '#/games', null, setLang);
    const cleanup = controller.buildEffect()();

    const handler = LanguageEvents.subscribe.calls.mostRecent().args[0];
    handler({ detail: { language: 'en' } });

    expect(setLang).toHaveBeenCalledWith('en');

    cleanup();
    expect(LanguageEvents.unsubscribe).toHaveBeenCalledWith(handler);
  });

  it('syncs access state on auth change and unsubscribes on cleanup', function() {
    const eventTarget = jasmine.createSpyObj('eventTarget', ['addEventListener', 'removeEventListener']);
    spyOn(AuthEvents, 'subscribe');
    spyOn(AuthEvents, 'unsubscribe');

    const controller = new AppController(Noop.noop, eventTarget, () => '#/games');
    const cleanup = controller.buildEffect()();

    const handler = AuthEvents.subscribe.calls.mostRecent().args[0];
    handler();

    expect(AccessStore.syncForAuthChange).toHaveBeenCalled();

    cleanup();
    expect(AuthEvents.unsubscribe).toHaveBeenCalledWith(handler);
  });

  describe('#renderPage', function() {
    it('passes the language code through to AppHelper', function() {
      const eventTarget = jasmine.createSpyObj('eventTarget', ['addEventListener', 'removeEventListener']);
      const controller = new AppController(Noop.noop, eventTarget, () => '#/games');
      expect(() => controller.renderPage('games', '#/games', 'en')).not.toThrow();
    });
  });
});
