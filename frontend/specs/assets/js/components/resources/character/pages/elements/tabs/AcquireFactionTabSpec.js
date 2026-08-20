import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import AcquireFactionTab
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/AcquireFactionTab.jsx';
import AcquireFactionTabHelper
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/helpers/AcquireFactionTabHelper.jsx';
import AcquireFactionTabController
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/controllers/AcquireFactionTabController.js';
import { buildCharacter } from '../../../../../../../../support/factories.js';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';

describe('AcquireFactionTab', function() {
  const character = buildCharacter({ id: 7, game_slug: 'demo', is_pc: true });

  const neverResolves = () => new Promise(Noop.noop);

  const renderTab = (props = {}) => {
    let capturedState;
    let capturedHandlers;

    spyOn(AcquireFactionTabHelper, 'render').and.callFake((state, handlers) => {
      capturedState = state;
      capturedHandlers = handlers;
      return React.createElement('div', null, 'acquire-faction-tab');
    });

    renderToStaticMarkup(
      React.createElement(AcquireFactionTab, {
        show: true,
        character,
        onSuccess: jasmine.createSpy('onSuccess'),
        ...props,
      })
    );

    return { state: capturedState, handlers: capturedHandlers };
  };

  beforeEach(function() {
    spyOn(AcquireFactionTabController.prototype, 'loadPage').and.callFake(neverResolves);
  });

  it('passes the default state to the helper, with no "hidden" concept (issue #943)', function() {
    const { state } = renderTab();

    expect(state.browse).toEqual({ items: [], page: 1, pages: 1, loading: false, error: '' });
    expect(state.selected).toBeNull();
    expect(state.hidden).toBeUndefined();
    expect(state.submitting).toBe(false);
    expect(state.actionError).toBe('');
    expect(state.search).toBe('');
  });

  it('loads the previous page via the controller when onPrev is triggered', function() {
    const { handlers } = renderTab();

    handlers.onPrev();

    expect(AcquireFactionTabController.prototype.loadPage)
      .toHaveBeenCalledWith(0, character, '', jasmine.any(Function));
  });

  it('loads the next page via the controller when onNext is triggered', function() {
    const { handlers } = renderTab();

    handlers.onNext();

    expect(AcquireFactionTabController.prototype.loadPage)
      .toHaveBeenCalledWith(2, character, '', jasmine.any(Function));
  });

  it('exposes an onSearchChange handler', function() {
    const { handlers } = renderTab();

    expect(typeof handlers.onSearchChange).toBe('function');
    expect(() => handlers.onSearchChange('silver')).not.toThrow();
  });

  it('exposes onSelect, onCancel, onPrev, onNext, and onConfirm handlers, no onHiddenChange', function() {
    const { handlers } = renderTab();

    ['onSelect', 'onCancel', 'onPrev', 'onNext', 'onConfirm'].forEach((name) => {
      expect(typeof handlers[name]).toBe('function');
    });
    expect(handlers.onHiddenChange).toBeUndefined();
  });

  it('does not throw when selecting a browse item', function() {
    const { handlers } = renderTab();

    expect(() => handlers.onSelect({ id: 9, name: 'The Silver Hand' })).not.toThrow();
  });

  it('does not throw when cancelling the current selection', function() {
    const { handlers } = renderTab();

    expect(() => handlers.onCancel()).not.toThrow();
  });
});
