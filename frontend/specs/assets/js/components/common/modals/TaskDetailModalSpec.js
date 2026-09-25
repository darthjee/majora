import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import TaskDetailModal, { buildTaskEditValues, submitTaskEdit }
  from '../../../../../../assets/js/components/common/modals/TaskDetailModal.jsx';
import TaskDetailModalHelper from '../../../../../../assets/js/components/common/modals/helpers/TaskDetailModalHelper.jsx';

describe('TaskDetailModal', function() {
  const task = {
    id: 1, short_description: 'Prep encounter', long_description: 'Details', completed: false, session: null, category: 'painting',
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
        onSave: jasmine.createSpy('onSave').and.returnValue(Promise.resolve(task)),
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
    expect(state.category).toBe('painting');
  });

  it('starts not saving and without an error', function() {
    const { state } = renderModal();

    expect(state.saving).toBe(false);
    expect(state.error).toBe('');
  });

  it('shows the category of whichever task it is opened with', function() {
    const { state } = renderModal({ task: { ...task, id: 2, category: 'buying' } });

    expect(state.category).toBe('buying');
  });

  it('starts at the other category when the task has none', function() {
    const { state } = renderModal({ task: { ...task, category: undefined } });

    expect(state.category).toBe('other');
  });

  it('does not call onSave when the category changes', function() {
    const onSave = jasmine.createSpy('onSave');
    const { handlers } = renderModal({ onSave });

    expect(() => handlers.onCategoryChange({ id: 'buying', name: 'Buying' })).not.toThrow();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('invokes onClose when the close handler is triggered', function() {
    const onClose = jasmine.createSpy('onClose');
    const { handlers } = renderModal({ onClose });

    handlers.onClose();

    expect(onClose).toHaveBeenCalled();
  });

  it('calls onSave with the current short/long description values', async function() {
    const onSave = jasmine.createSpy('onSave').and.returnValue(Promise.resolve(task));
    const { handlers } = renderModal({ onSave });

    await handlers.onSave();

    expect(onSave).toHaveBeenCalledWith({
      category: 'painting', shortDescription: 'Prep encounter', longDescription: 'Details',
    });
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

  describe('.submitTaskEdit', function() {
    const values = {
      category: 'buying', shortDescription: 'New short', longDescription: 'New long',
    };
    let setters;
    let savingCalls;

    beforeEach(function() {
      savingCalls = [];
      setters = {
        setSaving: jasmine.createSpy('setSaving').and.callFake((value) => savingCalls.push(value)),
        setEditing: jasmine.createSpy('setEditing'),
        setError: jasmine.createSpy('setError'),
      };
    });

    it('calls onSave with the given values', async function() {
      const onSave = jasmine.createSpy('onSave').and.returnValue(Promise.resolve(task));

      await submitTaskEdit(onSave, values, setters);

      expect(onSave).toHaveBeenCalledWith(values);
    });

    describe('when onSave resolves to a task', function() {
      beforeEach(async function() {
        const onSave = jasmine.createSpy('onSave').and.returnValue(Promise.resolve(task));

        await submitTaskEdit(onSave, values, setters);
      });

      it('leaves edit mode', function() {
        expect(setters.setEditing).toHaveBeenCalledWith(false);
      });

      it('flags saving and then clears it', function() {
        expect(savingCalls).toEqual([true, false]);
      });

      it('only clears the error', function() {
        expect(setters.setError.calls.allArgs()).toEqual([['']]);
      });
    });

    describe('when onSave resolves to null', function() {
      beforeEach(async function() {
        const onSave = jasmine.createSpy('onSave').and.returnValue(Promise.resolve(null));

        await submitTaskEdit(onSave, values, setters);
      });

      it('stays in edit mode', function() {
        expect(setters.setEditing).not.toHaveBeenCalled();
      });

      it('sets the save error', function() {
        expect(setters.setError).toHaveBeenCalledWith('Unable to save task.');
      });

      it('clears the saving flag', function() {
        expect(savingCalls).toEqual([true, false]);
      });
    });

    describe('when onSave rejects', function() {
      beforeEach(async function() {
        const onSave = jasmine.createSpy('onSave').and.returnValue(Promise.reject(new Error('boom')));

        await submitTaskEdit(onSave, values, setters);
      });

      it('stays in edit mode', function() {
        expect(setters.setEditing).not.toHaveBeenCalled();
      });

      it('sets the save error', function() {
        expect(setters.setError).toHaveBeenCalledWith('Unable to save task.');
      });

      it('clears the saving flag', function() {
        expect(savingCalls).toEqual([true, false]);
      });
    });
  });

  describe('.buildTaskEditValues', function() {
    it('builds the form values from the task, so cancel restores the original category', function() {
      expect(buildTaskEditValues(task)).toEqual({
        category: 'painting', shortDescription: 'Prep encounter', longDescription: 'Details',
      });
    });

    it('defaults to other and empty descriptions for a null task', function() {
      expect(buildTaskEditValues(null)).toEqual({
        category: 'other', shortDescription: '', longDescription: '',
      });
    });
  });
});
