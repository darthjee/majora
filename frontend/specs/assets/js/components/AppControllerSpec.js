import AppController from '../../../../assets/js/components/AppController.js';

describe('AppController', function() {
  it('resolves page from current hash', function() {
    const eventTarget = jasmine.createSpyObj('eventTarget', ['addEventListener', 'removeEventListener']);
    const controller = new AppController(() => {}, eventTarget, () => '#/games');
    expect(controller.getPage()).toBe('games');
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

    cleanup();
    expect(eventTarget.removeEventListener).toHaveBeenCalled();
  });
});
