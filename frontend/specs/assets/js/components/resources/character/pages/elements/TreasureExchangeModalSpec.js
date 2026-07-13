import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import TreasureExchangeModal, { buildPartialNotice }
  from '../../../../../../../../assets/js/components/resources/character/pages/elements/TreasureExchangeModal.jsx';
import TreasureExchangeModalHelper from '../../../../../../../../assets/js/components/resources/character/pages/elements/helpers/TreasureExchangeModalHelper.jsx';
import TreasureExchangeModalController
  from '../../../../../../../../assets/js/components/resources/character/pages/elements/controllers/TreasureExchangeModalController.js';
import { buildCharacter } from '../../../../../../../support/factories.js';

describe('TreasureExchangeModal', function() {
  const character = buildCharacter({
    id: 7, game_slug: 'demo', is_pc: true, money: 500,
  });

  // eslint-disable-next-line no-empty-function
  const neverResolves = () => new Promise(() => {});

  const renderModal = (props = {}) => {
    let capturedHandlers;
    let capturedState;

    spyOn(TreasureExchangeModalHelper, 'render').and.callFake((show, state, handlers) => {
      capturedState = state;
      capturedHandlers = handlers;
      return React.createElement('div', null, 'modal');
    });

    renderToStaticMarkup(
      React.createElement(TreasureExchangeModal, {
        show: true,
        character,
        ownedTreasures: [],
        onClose: jasmine.createSpy('onClose'),
        onSuccess: jasmine.createSpy('onSuccess'),
        ...props,
      })
    );

    return { state: capturedState, handlers: capturedHandlers };
  };

  beforeEach(function() {
    spyOn(TreasureExchangeModalController.prototype, 'fetchAcquirePage').and.callFake(neverResolves);
    spyOn(TreasureExchangeModalController.prototype, 'fetchSellPage').and.callFake(neverResolves);
  });

  it('passes the default state to the helper', function() {
    const { state } = renderModal();

    expect(state.activeTab).toBe('acquire');
    expect(state.browse).toEqual({ items: [], page: 1, pages: 1, loading: false, error: '' });
    expect(state.selected).toBeNull();
    expect(state.quantity).toBe(1);
    expect(state.submitting).toBe(false);
    expect(state.actionError).toBe('');
  });

  it('builds ownedByTreasureId from the ownedTreasures prop', function() {
    const ownedTreasures = [
      { id: 1, treasure_id: 9, name: 'Ring', quantity: 3, value: 50 },
      { id: 2, treasure_id: 11, name: 'Crown', quantity: 1, value: 500 },
    ];

    const { state } = renderModal({ ownedTreasures });

    expect(state.ownedByTreasureId).toEqual({ 9: 3, 11: 1 });
  });

  it('invokes onClose when the close handler is triggered', function() {
    const onClose = jasmine.createSpy('onClose');
    const { handlers } = renderModal({ onClose });

    handlers.onClose();

    expect(onClose).toHaveBeenCalled();
  });

  it('fetches the sell page via the controller when the tab changes to sell', function() {
    const { handlers } = renderModal();

    handlers.onTabChange('sell');

    expect(TreasureExchangeModalController.prototype.fetchSellPage).toHaveBeenCalledWith(
      'demo', 7, true, null, { page: 1, perPage: 10 }
    );
  });

  it('fetches the previous acquire page via the controller when onPrev is triggered', function() {
    const { handlers } = renderModal();

    handlers.onPrev();

    expect(TreasureExchangeModalController.prototype.fetchAcquirePage).toHaveBeenCalledWith(
      'demo', null, { page: 0, perPage: 10, maxValue: 500 }
    );
  });

  it('fetches the next acquire page via the controller when onNext is triggered', function() {
    const { handlers } = renderModal();

    handlers.onNext();

    expect(TreasureExchangeModalController.prototype.fetchAcquirePage).toHaveBeenCalledWith(
      'demo', null, { page: 2, perPage: 10, maxValue: 500 }
    );
  });
});

describe('buildPartialNotice', function() {
  it('returns an empty string on the sell tab', function() {
    expect(buildPartialNotice('sell', 5, 2)).toBe('');
  });

  it('returns an empty string when acquired is not a number', function() {
    expect(buildPartialNotice('acquire', 5, undefined)).toBe('');
  });

  it('returns an empty string when acquired matches the requested quantity', function() {
    expect(buildPartialNotice('acquire', 5, 5)).toBe('');
  });

  it('returns an empty string when acquired is greater than the requested quantity', function() {
    expect(buildPartialNotice('acquire', 5, 8)).toBe('');
  });

  it('returns the translated notice when acquired is less than the requested quantity', function() {
    expect(buildPartialNotice('acquire', 5, 2))
      .toBe('Only 2 of 5 were available and were acquired.');
  });
});
