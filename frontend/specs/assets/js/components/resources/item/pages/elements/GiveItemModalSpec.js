import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GiveItemModal
  from '../../../../../../../../assets/js/components/resources/item/pages/elements/GiveItemModal.jsx';
import GiveItemModalHelper
  from '../../../../../../../../assets/js/components/resources/item/pages/elements/helpers/GiveItemModalHelper.jsx';
import GiveItemModalController
  from '../../../../../../../../assets/js/components/resources/item/pages/elements/controllers/GiveItemModalController.js';

describe('GiveItemModal', function() {
  const item = { id: 9, hidden: false };

  // eslint-disable-next-line no-empty-function
  const neverResolves = () => new Promise(() => {});

  const renderModal = (props = {}) => {
    let capturedState;
    let capturedHandlers;

    spyOn(GiveItemModalHelper, 'render').and.callFake((show, state, handlers) => {
      capturedState = state;
      capturedHandlers = handlers;
      return React.createElement('div', null, 'give-item-modal');
    });

    renderToStaticMarkup(React.createElement(GiveItemModal, {
      show: true,
      item,
      gameSlug: 'demo',
      onClose: jasmine.createSpy('onClose'),
      ...props,
    }));

    return { state: capturedState, handlers: capturedHandlers };
  };

  beforeEach(function() {
    spyOn(GiveItemModalController.prototype, 'loadPage').and.callFake(neverResolves);
  });

  it('passes the default state to the helper', function() {
    const { state } = renderModal();

    expect(state.activeTab).toBe('pcs');
    expect(state.browse).toEqual({
      items: [], page: 1, pages: 1, loading: false, error: '',
    });
    expect(state.search).toBe('');
    expect(state.receiving).toEqual([]);
    expect(state.submitting).toBe(false);
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

    expect(GiveItemModalController.prototype.loadPage).toHaveBeenCalledWith(
      0, 'demo', 'pcs', '', jasmine.any(Function),
    );
  });

  it('loads the next page via the controller when onNext is triggered', function() {
    const { handlers } = renderModal();

    handlers.onNext();

    expect(GiveItemModalController.prototype.loadPage).toHaveBeenCalledWith(
      2, 'demo', 'pcs', '', jasmine.any(Function),
    );
  });

  it('adds the selected character through the controller when onSelectCharacter is triggered', function() {
    spyOn(GiveItemModalController.prototype, 'addCharacter').and.returnValue(Promise.resolve());
    const { handlers } = renderModal();
    const character = { id: 3, name: 'Aria' };

    handlers.onSelectCharacter(character);

    expect(GiveItemModalController.prototype.addCharacter).toHaveBeenCalledWith(
      character, 'pcs', 'demo', 9, [], jasmine.any(Function),
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

  it('submits through the controller with the item id, hidden flag, and canGiveHidden, then calls onSuccess', async function() {
    spyOn(GiveItemModalController.prototype, 'submit').and.returnValue(Promise.resolve());
    const onSuccess = jasmine.createSpy('onSuccess');
    const { handlers } = renderModal({
      item: { id: 9, hidden: true }, canGiveHidden: true, onSuccess,
    });

    await handlers.onSubmit();

    expect(GiveItemModalController.prototype.submit).toHaveBeenCalledWith(
      [], 'demo', 9, true, true, jasmine.objectContaining({
        setSubmitting: jasmine.any(Function), setReceiving: jasmine.any(Function),
      }),
    );
    expect(onSuccess).toHaveBeenCalled();
  });

  it('defaults canGiveHidden to false and hidden to false when not given', async function() {
    spyOn(GiveItemModalController.prototype, 'submit').and.returnValue(Promise.resolve());
    const { handlers } = renderModal({ item: { id: 9 } });

    await handlers.onSubmit();

    expect(GiveItemModalController.prototype.submit).toHaveBeenCalledWith(
      [], 'demo', 9, false, false, jasmine.any(Object),
    );
  });

  it('forwards the onClose handler as-is', function() {
    const onClose = jasmine.createSpy('onClose');
    const { handlers } = renderModal({ onClose });

    handlers.onClose();

    expect(onClose).toHaveBeenCalled();
  });
});
