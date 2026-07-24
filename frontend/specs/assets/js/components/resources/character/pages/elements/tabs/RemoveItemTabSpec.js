import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import RemoveItemTab
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/RemoveItemTab.jsx';
import RemoveItemTabHelper
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/helpers/RemoveItemTabHelper.jsx';
import RemoveItemTabController
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/controllers/RemoveItemTabController.js';
import { buildCharacter } from '../../../../../../../../support/factories.js';

describe('RemoveItemTab', function() {
  const character = buildCharacter({ id: 7, game_slug: 'demo', is_pc: true });

  // eslint-disable-next-line no-empty-function
  const neverResolves = () => new Promise(() => {});

  const renderTab = (props = {}) => {
    let capturedState;
    let capturedHandlers;

    spyOn(RemoveItemTabHelper, 'render').and.callFake((state, handlers) => {
      capturedState = state;
      capturedHandlers = handlers;
      return React.createElement('div', null, 'remove-item-tab');
    });

    renderToStaticMarkup(
      React.createElement(RemoveItemTab, {
        show: true,
        character,
        onSuccess: jasmine.createSpy('onSuccess'),
        ...props,
      })
    );

    return { state: capturedState, handlers: capturedHandlers };
  };

  beforeEach(function() {
    spyOn(RemoveItemTabController.prototype, 'loadPage').and.callFake(neverResolves);
  });

  it('passes the default state to the helper', function() {
    const { state } = renderTab();

    expect(state.browse).toEqual({ items: [], page: 1, pages: 1, loading: false, error: '' });
    expect(state.selected).toBeNull();
    expect(state.submitting).toBe(false);
    expect(state.actionError).toBe('');
    expect(state.search).toBe('');
  });

  it('loads the previous page via the controller when onPrev is triggered', function() {
    const { handlers } = renderTab();

    handlers.onPrev();

    expect(RemoveItemTabController.prototype.loadPage)
      .toHaveBeenCalledWith(0, character, '', jasmine.any(Function));
  });

  it('loads the next page via the controller when onNext is triggered', function() {
    const { handlers } = renderTab();

    handlers.onNext();

    expect(RemoveItemTabController.prototype.loadPage)
      .toHaveBeenCalledWith(2, character, '', jasmine.any(Function));
  });

  it('exposes an onSearchChange handler', function() {
    const { handlers } = renderTab();

    expect(typeof handlers.onSearchChange).toBe('function');
    expect(() => handlers.onSearchChange('ring')).not.toThrow();
  });

  it('exposes onSelect, onCancel, onPrev, onNext, and onConfirm handlers', function() {
    const { handlers } = renderTab();

    ['onSelect', 'onCancel', 'onPrev', 'onNext', 'onConfirm'].forEach((name) => {
      expect(typeof handlers[name]).toBe('function');
    });
  });
});
