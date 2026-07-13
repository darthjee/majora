import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ViewAsModal from '../../../../../assets/js/components/common/ViewAsModal.jsx';
import ViewAsModalHelper from '../../../../../assets/js/components/common/helpers/ViewAsModalHelper.jsx';
import AccessStore from '../../../../../assets/js/utils/AccessStore.js';

describe('ViewAsModal', function() {
  const renderModal = (props = {}) => {
    let capturedShow;
    let capturedState;
    let capturedHandlers;

    spyOn(ViewAsModalHelper, 'render').and.callFake((show, state, handlers) => {
      capturedShow = show;
      capturedState = state;
      capturedHandlers = handlers;
      return React.createElement('div', null, 'modal');
    });

    renderToStaticMarkup(
      React.createElement(ViewAsModal, {
        show: true,
        onClose: jasmine.createSpy('onClose'),
        ...props,
      }),
    );

    return { show: capturedShow, state: capturedState, handlers: capturedHandlers };
  };

  afterEach(function() {
    AccessStore.setFacade({ enabled: false, roles: [] });
  });

  it('seeds local state from the disabled/empty facade by default', function() {
    const { state } = renderModal();

    expect(state).toEqual({ enabled: false, roles: [] });
  });

  it('seeds local state from an already-active facade', function() {
    AccessStore.setFacade({ enabled: true, roles: ['dm'] });

    const { state } = renderModal();

    expect(state).toEqual({ enabled: true, roles: ['dm'] });
  });

  it('forwards the show prop as-is', function() {
    const { show } = renderModal({ show: false });

    expect(show).toBe(false);
  });

  it('invokes onClose when the cancel handler is triggered, without touching AccessStore', function() {
    spyOn(AccessStore, 'setFacade');
    const onClose = jasmine.createSpy('onClose');
    const { handlers } = renderModal({ onClose });

    handlers.onCancel();

    expect(onClose).toHaveBeenCalled();
    expect(AccessStore.setFacade).not.toHaveBeenCalled();
  });

  it('commits the seeded state to AccessStore when the save handler is triggered', function() {
    const onClose = jasmine.createSpy('onClose');
    const { handlers } = renderModal({ onClose });

    handlers.onSave();

    expect(AccessStore.getFacade()).toEqual({ enabled: false, roles: [] });
    expect(onClose).toHaveBeenCalled();
  });

  it('exposes toggle handlers without throwing', function() {
    const { handlers } = renderModal();

    expect(() => {
      handlers.onToggleEnabled();
      handlers.onToggleRole('dm');
    }).not.toThrow();
  });
});
