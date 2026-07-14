import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import MoneyEditModal from '../../../../../assets/js/components/common/MoneyEditModal.jsx';
import MoneyEditModalHelper from '../../../../../assets/js/components/common/helpers/MoneyEditModalHelper.jsx';

describe('MoneyEditModal', function() {
  const renderModal = (props = {}) => {
    let capturedShow;
    let capturedState;
    let capturedHandlers;
    let capturedContext;

    spyOn(MoneyEditModalHelper, 'render').and.callFake((show, state, handlers, context) => {
      capturedShow = show;
      capturedState = state;
      capturedHandlers = handlers;
      capturedContext = context;
      return React.createElement('div', null, 'modal');
    });

    renderToStaticMarkup(
      React.createElement(MoneyEditModal, {
        show: true,
        money: 332,
        onClose: jasmine.createSpy('onClose'),
        onConfirm: jasmine.createSpy('onConfirm'),
        ...props,
      }),
    );

    return {
      show: capturedShow, state: capturedState, handlers: capturedHandlers, context: capturedContext,
    };
  };

  it('seeds local state as a dense breakdown of the given money prop', function() {
    const { state } = renderModal({ money: 332 });

    expect(state.breakdown).toEqual({
      cp: 22, sp: 21, gp: 1, pp: 0, gems: 0,
    });
  });

  it('forwards the show prop as-is', function() {
    const { show } = renderModal({ show: false });

    expect(show).toBe(false);
  });

  it('seeds a zeroed breakdown for a money value of 0', function() {
    const { state } = renderModal({ money: 0 });

    expect(state.breakdown).toEqual({
      cp: 0, sp: 0, gp: 0, pp: 0, gems: 0,
    });
  });

  it('handles a string money prop', function() {
    const { state } = renderModal({ money: '332' });

    expect(state.breakdown).toEqual({
      cp: 22, sp: 21, gp: 1, pp: 0, gems: 0,
    });
  });

  it('computes canConfirm as true for a freshly seeded breakdown', function() {
    const { state } = renderModal({ money: 332 });

    expect(state.canConfirm).toBe(true);
  });

  it('defaults the context to character when not given', function() {
    const { context } = renderModal();

    expect(context).toBe('character');
  });

  it('invokes onClose when the close handler is triggered', function() {
    const onClose = jasmine.createSpy('onClose');
    const { handlers } = renderModal({ onClose });

    handlers.onClose();

    expect(onClose).toHaveBeenCalled();
  });

  it('calls onConfirm with the recalculated total from the seeded breakdown', function() {
    const onConfirm = jasmine.createSpy('onConfirm');
    const { handlers } = renderModal({ onConfirm, money: 332 });

    handlers.onConfirm();

    expect(onConfirm).toHaveBeenCalledWith(332);
  });

  it('exposes a field change handler without throwing', function() {
    const { handlers } = renderModal();

    expect(() => handlers.onFieldChange('gp', '5')).not.toThrow();
  });

  describe('with the treasure context', function() {
    it('seeds local state as a dense CP/SP/GP breakdown, with no pp/gems keys', function() {
      const { state } = renderModal({ money: 332, context: 'treasure' });

      expect(state.breakdown).toEqual({ cp: 2, sp: 3, gp: 3 });
    });

    it('forwards the context prop to the helper', function() {
      const { context } = renderModal({ context: 'treasure' });

      expect(context).toBe('treasure');
    });

    it('computes canConfirm as true for a freshly seeded breakdown', function() {
      const { state } = renderModal({ money: 332, context: 'treasure' });

      expect(state.canConfirm).toBe(true);
    });

    it('calls onConfirm with the recalculated total from the seeded breakdown', function() {
      const onConfirm = jasmine.createSpy('onConfirm');
      const { handlers } = renderModal({ onConfirm, money: 332, context: 'treasure' });

      handlers.onConfirm();

      expect(onConfirm).toHaveBeenCalledWith(332);
    });
  });
});
