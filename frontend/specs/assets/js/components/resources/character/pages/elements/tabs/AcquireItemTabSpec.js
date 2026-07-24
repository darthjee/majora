import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import AcquireItemTab
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/AcquireItemTab.jsx';
import AcquireItemTabHelper
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/helpers/AcquireItemTabHelper.jsx';
import AcquireItemTabController
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/controllers/AcquireItemTabController.js';
import { buildCharacter } from '../../../../../../../../support/factories.js';

describe('AcquireItemTab', function() {
  const character = buildCharacter({ id: 7, game_slug: 'demo', is_pc: true });

  // eslint-disable-next-line no-empty-function
  const neverResolves = () => new Promise(() => {});

  const renderTab = (props = {}) => {
    let capturedState;
    let capturedHandlers;

    spyOn(AcquireItemTabHelper, 'render').and.callFake((state, handlers) => {
      capturedState = state;
      capturedHandlers = handlers;
      return React.createElement('div', null, 'acquire-item-tab');
    });

    renderToStaticMarkup(
      React.createElement(AcquireItemTab, {
        show: true,
        character,
        onSuccess: jasmine.createSpy('onSuccess'),
        ...props,
      })
    );

    return { state: capturedState, handlers: capturedHandlers };
  };

  beforeEach(function() {
    spyOn(AcquireItemTabController.prototype, 'loadPage').and.callFake(neverResolves);
  });

  it('passes the default state to the helper', function() {
    const { state } = renderTab();

    expect(state.browse).toEqual({ items: [], page: 1, pages: 1, loading: false, error: '' });
    expect(state.selected).toBeNull();
    expect(state.hidden).toBe(false);
    expect(state.submitting).toBe(false);
    expect(state.actionError).toBe('');
    expect(state.search).toBe('');
  });

  it('loads the previous page via the controller when onPrev is triggered', function() {
    const { handlers } = renderTab();

    handlers.onPrev();

    expect(AcquireItemTabController.prototype.loadPage).toHaveBeenCalledWith(0, character, '', jasmine.any(Function));
  });

  it('loads the next page via the controller when onNext is triggered', function() {
    const { handlers } = renderTab();

    handlers.onNext();

    expect(AcquireItemTabController.prototype.loadPage).toHaveBeenCalledWith(2, character, '', jasmine.any(Function));
  });

  it('exposes an onSearchChange handler', function() {
    const { handlers } = renderTab();

    expect(typeof handlers.onSearchChange).toBe('function');
    expect(() => handlers.onSearchChange('sword')).not.toThrow();
  });

  it('exposes an onHiddenChange handler', function() {
    const { handlers } = renderTab();

    expect(typeof handlers.onHiddenChange).toBe('function');
    expect(() => handlers.onHiddenChange(true)).not.toThrow();
  });

  it('exposes onSelect, onCancel, onPrev, onNext, onHiddenChange, and onConfirm handlers', function() {
    const { handlers } = renderTab();

    ['onSelect', 'onCancel', 'onPrev', 'onNext', 'onHiddenChange', 'onConfirm'].forEach((name) => {
      expect(typeof handlers[name]).toBe('function');
    });
  });
});
