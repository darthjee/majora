import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import TaskDetailModal from '../../../../../assets/js/components/common/TaskDetailModal.jsx';
import TaskDetailModalHelper from '../../../../../assets/js/components/common/helpers/TaskDetailModalHelper.jsx';

describe('TaskDetailModal', function() {
  const task = {
    id: 1, short_description: 'Prep encounter', long_description: 'Details', completed: false, session: null,
  };

  const renderModal = (props = {}) => {
    let capturedState;
    let capturedHandlers;

    spyOn(TaskDetailModalHelper, 'render').and.callFake((show, state, handlers) => {
      capturedState = state;
      capturedHandlers = handlers;
      return React.createElement('div', null, 'modal');
    });

    renderToStaticMarkup(
      React.createElement(TaskDetailModal, {
        show: true,
        task,
        onClose: jasmine.createSpy('onClose'),
        onSave: jasmine.createSpy('onSave'),
        ...props,
      }),
    );

    return { state: capturedState, handlers: capturedHandlers };
  };

  it('starts in view mode with fields initialized from the task', function() {
    const { state } = renderModal();

    expect(state.editing).toBe(false);
    expect(state.task).toBe(task);
    expect(state.shortDescription).toBe('Prep encounter');
    expect(state.longDescription).toBe('Details');
  });

  it('invokes onClose when the close handler is triggered', function() {
    const onClose = jasmine.createSpy('onClose');
    const { handlers } = renderModal({ onClose });

    handlers.onClose();

    expect(onClose).toHaveBeenCalled();
  });

  it('calls onSave with the current short/long description values', function() {
    const onSave = jasmine.createSpy('onSave');
    const { handlers } = renderModal({ onSave });

    handlers.onSave();

    expect(onSave).toHaveBeenCalledWith({ shortDescription: 'Prep encounter', longDescription: 'Details' });
  });

  it('does not call onSave when cancel is triggered', function() {
    const onSave = jasmine.createSpy('onSave');
    const { handlers } = renderModal({ onSave });

    handlers.onCancel();

    expect(onSave).not.toHaveBeenCalled();
  });

  it('handles a null task without throwing', function() {
    expect(() => renderModal({ task: null, show: false })).not.toThrow();
  });
});
