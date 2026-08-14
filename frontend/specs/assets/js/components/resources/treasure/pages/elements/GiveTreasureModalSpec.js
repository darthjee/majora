import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GiveTreasureModal
  from '../../../../../../../../assets/js/components/resources/treasure/pages/elements/GiveTreasureModal.jsx';
import GiveTreasureModalHelper
  from '../../../../../../../../assets/js/components/resources/treasure/pages/elements/helpers/GiveTreasureModalHelper.jsx';
import GiveTreasureModalController
  from '../../../../../../../../assets/js/components/resources/treasure/pages/elements/controllers/GiveTreasureModalController.js';

describe('GiveTreasureModal', function() {
  const treasure = { id: 9, hidden: false, available_units: 5 };

  // eslint-disable-next-line no-empty-function
  const neverResolves = () => new Promise(() => {});

  const renderModal = (props = {}) => {
    let capturedState;
    let capturedHandlers;

    spyOn(GiveTreasureModalHelper, 'render').and.callFake((show, state, handlers) => {
      capturedState = state;
      capturedHandlers = handlers;
      return React.createElement('div', null, 'give-treasure-modal');
    });

    renderToStaticMarkup(React.createElement(GiveTreasureModal, {
      show: true,
      treasure,
      gameSlug: 'demo',
      onClose: jasmine.createSpy('onClose'),
      ...props,
    }));

    return { state: capturedState, handlers: capturedHandlers };
  };

  beforeEach(function() {
    spyOn(GiveTreasureModalController.prototype, 'loadPage').and.callFake(neverResolves);
  });

  it('passes the default state to the helper, including the treasure availableUnits', function() {
    const { state } = renderModal();

    expect(state.activeTab).toBe('pcs');
    expect(state.browse).toEqual({
      items: [], page: 1, pages: 1, loading: false, error: '',
    });
    expect(state.search).toBe('');
    expect(state.receiving).toEqual([]);
    expect(state.submitting).toBe(false);
    expect(state.availableUnits).toBe(5);
  });

  it('defaults availableUnits to null when the treasure has none set', function() {
    const { state } = renderModal({ treasure: { id: 9 } });

    expect(state.availableUnits).toBeNull();
  });

  it('exposes every handler the helper needs', function() {
    const { handlers } = renderModal();

    [
      'onTabChange', 'onSearchChange', 'onPrev', 'onNext', 'onSelectCharacter', 'onIncrement',
      'onDecrement', 'onRemove', 'onSubmit', 'onClear', 'onClose',
    ].forEach((name) => {
      expect(typeof handlers[name]).toBe('function');
    });
  });

  it('loads the previous page via the controller when onPrev is triggered', function() {
    const { handlers } = renderModal();

    handlers.onPrev();

    expect(GiveTreasureModalController.prototype.loadPage).toHaveBeenCalledWith(
      0, 'demo', 'pcs', '', jasmine.any(Function),
    );
  });

  it('loads the next page via the controller when onNext is triggered', function() {
    const { handlers } = renderModal();

    handlers.onNext();

    expect(GiveTreasureModalController.prototype.loadPage).toHaveBeenCalledWith(
      2, 'demo', 'pcs', '', jasmine.any(Function),
    );
  });

  it('adds the selected character through the controller, passing the availableUnits cap', function() {
    spyOn(GiveTreasureModalController.prototype, 'addCharacter').and.returnValue(Promise.resolve());
    const { handlers } = renderModal();
    const character = { id: 3, name: 'Aria' };

    handlers.onSelectCharacter(character);

    expect(GiveTreasureModalController.prototype.addCharacter).toHaveBeenCalledWith(
      character, 'pcs', 'demo', 9, [], jasmine.any(Function), 5,
    );
  });

  it('does not throw when onTabChange/onSearchChange/onClear are triggered', function() {
    const { handlers } = renderModal();

    expect(() => {
      handlers.onTabChange('npcs');
      handlers.onSearchChange('aria');
      handlers.onClear();
    }).not.toThrow();
  });

  it('does not throw when onIncrement/onDecrement/onRemove are triggered', function() {
    const { handlers } = renderModal();

    expect(() => {
      handlers.onIncrement('pcs', 1);
      handlers.onDecrement('pcs', 1);
      handlers.onRemove('pcs', 1);
    }).not.toThrow();
  });

  it('submits through the controller with the treasure id and canGiveHidden, then calls onSuccess', async function() {
    spyOn(GiveTreasureModalController.prototype, 'submit').and.returnValue(Promise.resolve());
    const onSuccess = jasmine.createSpy('onSuccess');
    const { handlers } = renderModal({ canGiveHidden: true, onSuccess });

    await handlers.onSubmit();

    expect(GiveTreasureModalController.prototype.submit).toHaveBeenCalledWith(
      [], 'demo', 9, true, jasmine.objectContaining({
        setSubmitting: jasmine.any(Function), setReceiving: jasmine.any(Function),
      }),
    );
    expect(onSuccess).toHaveBeenCalled();
  });

  it('defaults canGiveHidden to false when not given', async function() {
    spyOn(GiveTreasureModalController.prototype, 'submit').and.returnValue(Promise.resolve());
    const { handlers } = renderModal();

    await handlers.onSubmit();

    expect(GiveTreasureModalController.prototype.submit).toHaveBeenCalledWith(
      [], 'demo', 9, false, jasmine.any(Object),
    );
  });

  it('forwards the onClose handler as-is', function() {
    const onClose = jasmine.createSpy('onClose');
    const { handlers } = renderModal({ onClose });

    handlers.onClose();

    expect(onClose).toHaveBeenCalled();
  });
});
