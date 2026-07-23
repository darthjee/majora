import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import AcquireTreasureTab
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/AcquireTreasureTab.jsx';
import AcquireTreasureTabHelper
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/helpers/AcquireTreasureTabHelper.jsx';
import AcquireTreasureTabController
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/controllers/AcquireTreasureTabController.js';
import { buildCharacter } from '../../../../../../../../support/factories.js';

describe('AcquireTreasureTab', function() {
  const character = buildCharacter({
    id: 7, game_slug: 'demo', is_pc: true, money: 500,
  });

  // eslint-disable-next-line no-empty-function
  const neverResolves = () => new Promise(() => {});

  const renderTab = (props = {}) => {
    let capturedState;
    let capturedHandlers;

    spyOn(AcquireTreasureTabHelper, 'render').and.callFake((state, handlers) => {
      capturedState = state;
      capturedHandlers = handlers;
      return React.createElement('div', null, 'acquire-tab');
    });

    renderToStaticMarkup(
      React.createElement(AcquireTreasureTab, {
        show: true,
        character,
        ownedTreasures: [],
        onSuccess: jasmine.createSpy('onSuccess'),
        ...props,
      })
    );

    return { state: capturedState, handlers: capturedHandlers };
  };

  beforeEach(function() {
    spyOn(AcquireTreasureTabController.prototype, 'loadPage').and.callFake(neverResolves);
  });

  it('passes the default state to the helper', function() {
    const { state } = renderTab();

    expect(state.browse).toEqual({ items: [], page: 1, pages: 1, loading: false, error: '' });
    expect(state.selected).toBeNull();
    expect(state.quantity).toBe(1);
    expect(state.submitting).toBe(false);
    expect(state.actionError).toBe('');
    expect(state.gameType).toBe('dnd');
    expect(state.search).toBe('');
  });

  it('forwards the gameType prop to the helper', function() {
    const { state } = renderTab({ gameType: 'deadlands' });

    expect(state.gameType).toBe('deadlands');
  });

  it('builds ownedByTreasureId from the ownedTreasures prop', function() {
    const ownedTreasures = [
      { id: 1, treasure_id: 9, name: 'Ring', quantity: 3, value: 50 },
      { id: 2, treasure_id: 11, name: 'Crown', quantity: 1, value: 500 },
    ];

    const { state } = renderTab({ ownedTreasures });

    expect(state.ownedByTreasureId).toEqual({ 9: 3, 11: 1 });
  });

  it('loads the previous page via the controller when onPrev is triggered', function() {
    const { handlers } = renderTab();

    handlers.onPrev();

    expect(AcquireTreasureTabController.prototype.loadPage).toHaveBeenCalledWith(0, character, '', jasmine.any(Function));
  });

  it('loads the next page via the controller when onNext is triggered', function() {
    const { handlers } = renderTab();

    handlers.onNext();

    expect(AcquireTreasureTabController.prototype.loadPage).toHaveBeenCalledWith(2, character, '', jasmine.any(Function));
  });

  it('exposes an onSearchChange handler', function() {
    const { handlers } = renderTab();

    expect(typeof handlers.onSearchChange).toBe('function');
    expect(() => handlers.onSearchChange('sword')).not.toThrow();
  });

  it('exposes onSelect, onCancel, onPrev, onNext, onQuantityChange, and onConfirm handlers', function() {
    const { handlers } = renderTab();

    ['onSelect', 'onCancel', 'onPrev', 'onNext', 'onQuantityChange', 'onConfirm'].forEach((name) => {
      expect(typeof handlers[name]).toBe('function');
    });
  });
});
