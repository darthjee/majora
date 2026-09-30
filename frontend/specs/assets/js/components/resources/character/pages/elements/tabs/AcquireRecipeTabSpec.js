import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import AcquireRecipeTab from '../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/AcquireRecipeTab.jsx';
import AcquireRecipeTabHelper
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/helpers/AcquireRecipeTabHelper.jsx';
import AcquireRecipeTabController
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/controllers/AcquireRecipeTabController.js';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';

describe('AcquireRecipeTab', function() {
  const character = { id: 7, game_slug: 'demo', is_pc: true };

  const renderTab = () => {
    let captured;

    spyOn(AcquireRecipeTabHelper, 'render').and.callFake((state, handlers) => {
      captured = { state, handlers };
      return React.createElement('div', null, 'tab');
    });

    renderToStaticMarkup(React.createElement(AcquireRecipeTab, {
      show: true, character, onSuccess: jasmine.createSpy('onSuccess'),
    }));

    return captured;
  };

  beforeEach(function() {
    spyOn(AcquireRecipeTabController.prototype, 'loadPage').and.callFake(() => new Promise(Noop.noop));
  });

  it('passes the default state to the helper', function() {
    const { state } = renderTab();

    expect(state).toEqual({
      browse: {
        items: [], page: 1, pages: 1, loading: false, error: '',
      },
      selected: null,
      submitting: false,
      actionError: '',
      search: '',
    });
  });

  it('loads the previous/next pages through the controller', function() {
    const { handlers } = renderTab();

    handlers.onPrev();
    handlers.onNext();

    expect(AcquireRecipeTabController.prototype.loadPage).toHaveBeenCalledWith(0, character, '', jasmine.any(Function));
    expect(AcquireRecipeTabController.prototype.loadPage).toHaveBeenCalledWith(2, character, '', jasmine.any(Function));
  });

  it('delegates onConfirm to the controller', function() {
    spyOn(AcquireRecipeTabController.prototype, 'confirm');
    const { handlers } = renderTab();

    handlers.onConfirm();

    expect(AcquireRecipeTabController.prototype.confirm).toHaveBeenCalledWith(null, character, jasmine.objectContaining({
      onSuccess: jasmine.any(Function), reload: jasmine.any(Function),
    }));
  });

  it('exposes select/cancel/search handlers', function() {
    const { handlers } = renderTab();

    expect(() => handlers.onSelect({ id: 1 })).not.toThrow();
    expect(() => handlers.onCancel()).not.toThrow();
    expect(() => handlers.onSearchChange('pot')).not.toThrow();
  });
});
