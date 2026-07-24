import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ResourceExchangeModal
  from '../../../../../../../../assets/js/components/resources/character/pages/elements/ResourceExchangeModal.jsx';
import ResourceExchangeModalHelper
  from '../../../../../../../../assets/js/components/resources/character/pages/elements/helpers/ResourceExchangeModalHelper.jsx';
import treasureExchangeTabs
  from '../../../../../../../../assets/js/components/resources/character/pages/elements/treasureExchangeTabs.js';
import itemExchangeTabs
  from '../../../../../../../../assets/js/components/resources/character/pages/elements/itemExchangeTabs.js';
import { buildCharacter } from '../../../../../../../support/factories.js';

describe('ResourceExchangeModal', function() {
  const character = buildCharacter({
    id: 7, game_slug: 'demo', is_pc: true, money: 500,
  });

  const renderModal = (props = {}) => {
    let capturedShow;
    let capturedState;
    let capturedHandlers;

    spyOn(ResourceExchangeModalHelper, 'render').and.callFake((show, state, handlers) => {
      capturedShow = show;
      capturedState = state;
      capturedHandlers = handlers;
      return React.createElement('div', null, 'modal');
    });

    renderToStaticMarkup(
      React.createElement(ResourceExchangeModal, {
        show: true,
        character,
        tabs: treasureExchangeTabs,
        defaultTab: 'buy',
        ownedTreasures: [],
        onClose: jasmine.createSpy('onClose'),
        onSuccess: jasmine.createSpy('onSuccess'),
        ...props,
      })
    );

    return { show: capturedShow, state: capturedState, handlers: capturedHandlers };
  };

  it('defaults activeTab to the given defaultTab prop', function() {
    const { state } = renderModal();

    expect(state.activeTab).toBe('buy');
  });

  it('honors a different defaultTab prop, e.g. for the item exchange modal', function() {
    const { state } = renderModal({ tabs: itemExchangeTabs, defaultTab: 'acquire' });

    expect(state.activeTab).toBe('acquire');
  });

  it('forwards the tabs config map as-is', function() {
    const { state } = renderModal();

    expect(state.tabs).toBe(treasureExchangeTabs);
  });

  it('forwards the character, ownedTreasures, gameType, and onSuccess props', function() {
    const onSuccess = jasmine.createSpy('onSuccess');
    const ownedTreasures = [{ id: 1, treasure_id: 9, name: 'Ring', quantity: 1 }];

    const { state } = renderModal({ gameType: 'deadlands', ownedTreasures, onSuccess });

    expect(state.character).toBe(character);
    expect(state.ownedTreasures).toBe(ownedTreasures);
    expect(state.gameType).toBe('deadlands');
    expect(state.onSuccess).toBe(onSuccess);
  });

  it('defaults gameType to dnd', function() {
    const { state } = renderModal();

    expect(state.gameType).toBe('dnd');
  });

  it('forwards the show prop as-is', function() {
    const { show } = renderModal({ show: false });

    expect(show).toBe(false);
  });

  it('invokes onClose when the close handler is triggered', function() {
    const onClose = jasmine.createSpy('onClose');
    const { handlers } = renderModal({ onClose });

    handlers.onClose();

    expect(onClose).toHaveBeenCalled();
  });

  it('switches the active tab when onTabChange is triggered', function() {
    const { handlers } = renderModal();

    expect(() => handlers.onTabChange('sell')).not.toThrow();
  });
});
