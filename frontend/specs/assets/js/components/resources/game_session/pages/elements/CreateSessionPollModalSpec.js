import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import CreateSessionPollModal
  from '../../../../../../../../assets/js/components/resources/game_session/pages/elements/CreateSessionPollModal.jsx';
import CreateSessionPollModalHelper
  from '../../../../../../../../assets/js/components/resources/game_session/pages/elements/helpers/CreateSessionPollModalHelper.jsx';
import CreateSessionPollModalController
  from '../../../../../../../../assets/js/components/resources/game_session/pages/elements/controllers/CreateSessionPollModalController.js';

describe('CreateSessionPollModal', function() {
  const renderModal = (props = {}) => {
    let capturedShow;
    let capturedState;
    let capturedHandlers;

    spyOn(CreateSessionPollModalHelper, 'render').and.callFake((show, state, handlers) => {
      capturedShow = show;
      capturedState = state;
      capturedHandlers = handlers;
      return React.createElement('div', null, 'modal');
    });

    renderToStaticMarkup(
      React.createElement(CreateSessionPollModal, {
        show: true,
        onClose: jasmine.createSpy('onClose'),
        onConfirm: jasmine.createSpy('onConfirm'),
        ...props,
      }),
    );

    return {
      show: capturedShow,
      state: capturedState,
      handlers: capturedHandlers,
    };
  };

  it('forwards the show prop as-is', function() {
    const { show } = renderModal({ show: false });

    expect(show).toBe(false);
  });

  it('seeds the dates list with a single blank entry', function() {
    const { state } = renderModal();

    expect(state.dates).toEqual(['']);
  });

  it('defaults the type to multiple', function() {
    const { state } = renderModal();

    expect(state.type).toBe('multiple');
  });

  it('forwards the error prop as-is', function() {
    const { state } = renderModal({ error: 'Failed to create pool.' });

    expect(state.error).toBe('Failed to create pool.');
  });

  it('computes canConfirm as false for a freshly seeded (blank) dates list', function() {
    const { state } = renderModal();

    expect(state.canConfirm).toBe(false);
  });

  it('invokes onClose when the close handler is triggered', function() {
    const onClose = jasmine.createSpy('onClose');
    const { handlers } = renderModal({ onClose });

    handlers.onClose();

    expect(onClose).toHaveBeenCalled();
  });

  it('calls onConfirm with the non-blank dates computed by the controller and the current type', function() {
    spyOn(CreateSessionPollModalController, 'nonBlankDates').and.returnValue(['2024-01-01']);
    const onConfirm = jasmine.createSpy('onConfirm');
    const { handlers } = renderModal({ onConfirm });

    handlers.onConfirm();

    expect(CreateSessionPollModalController.nonBlankDates).toHaveBeenCalledWith(['']);
    expect(onConfirm).toHaveBeenCalledWith(['2024-01-01'], 'multiple');
  });

  it('wires onDateChange to CreateSessionPollModalController.handleDateChange with the current dates', function() {
    spyOn(CreateSessionPollModalController, 'handleDateChange');
    const { handlers } = renderModal();

    handlers.onDateChange(0, '2024-01-01');

    expect(CreateSessionPollModalController.handleDateChange)
      .toHaveBeenCalledWith(0, '2024-01-01', [''], jasmine.any(Function));
  });

  it('exposes onTypeChange as a callable handler', function() {
    const { handlers } = renderModal();

    expect(() => handlers.onTypeChange('single')).not.toThrow();
  });

  it('wires onDateRemove to CreateSessionPollModalController.handleDateRemove with the current dates', function() {
    spyOn(CreateSessionPollModalController, 'handleDateRemove');
    const { handlers } = renderModal();

    handlers.onDateRemove(0);

    expect(CreateSessionPollModalController.handleDateRemove)
      .toHaveBeenCalledWith(0, [''], jasmine.any(Function));
  });
});
