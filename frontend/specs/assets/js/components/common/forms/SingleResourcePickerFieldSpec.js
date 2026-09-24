import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import SingleResourcePickerField, { buildFieldBlurHandler }
  from '../../../../../../assets/js/components/common/forms/SingleResourcePickerField.jsx';
import SingleResourcePickerFieldHelper
  from '../../../../../../assets/js/components/common/forms/helpers/SingleResourcePickerFieldHelper.jsx';

describe('SingleResourcePickerField', function() {
  const renderField = (props = {}) => {
    let capturedState;
    let capturedHandlers;

    spyOn(SingleResourcePickerFieldHelper, 'render').and.callFake((state, handlers) => {
      capturedState = state;
      capturedHandlers = handlers;
      return React.createElement('div', null, 'single-resource-picker-field');
    });

    renderToStaticMarkup(React.createElement(SingleResourcePickerField, {
      picker: { resource: 'source', maxEntries: 4 },
      value: null,
      onChange: jasmine.createSpy('onChange'),
      label: 'Source',
      searchPlaceholder: 'Search sources...',
      ...props,
    }));

    return { state: capturedState, handlers: capturedHandlers };
  };

  it('passes the given props and starts not searching', function() {
    const { state } = renderField();

    expect(state.picker).toEqual({ resource: 'source', maxEntries: 4 });
    expect(state.value).toBeNull();
    expect(state.label).toBe('Source');
    expect(state.searchPlaceholder).toBe('Search sources...');
    expect(state.searching).toBe(false);
  });

  it('defaults errors to an empty array', function() {
    const { state } = renderField();

    expect(state.errors).toEqual([]);
  });

  it('passes the given errors through', function() {
    const { state } = renderField({ errors: ['invalid_choice'] });

    expect(state.errors).toEqual(['invalid_choice']);
  });

  it('passes a constant-mode picker through', function() {
    const translateOption = (value) => value.toUpperCase();
    const picker = { values: ['painting', 'other'], translateOption };
    const { state } = renderField({ picker });

    expect(state.picker).toBe(picker);
  });

  it('calls onChange with the picked item when onSelect is triggered', function() {
    const onChange = jasmine.createSpy('onChange');
    const { handlers } = renderField({ onChange });
    const item = { id: 1, name: 'Wyrmwood' };

    handlers.onSelect(item);

    expect(onChange).toHaveBeenCalledWith(item);
  });

  it('calls onChange with a constant-mode {id, name} item when onSelect is triggered', function() {
    const onChange = jasmine.createSpy('onChange');
    const { handlers } = renderField({
      onChange, picker: { values: ['painting'], translateOption: () => 'Pintura' },
    });

    handlers.onSelect({ id: 'painting', name: 'Pintura' });

    expect(onChange).toHaveBeenCalledWith({ id: 'painting', name: 'Pintura' });
  });

  it('does not throw when onReopenSearch is triggered', function() {
    const { handlers } = renderField();

    expect(() => handlers.onReopenSearch()).not.toThrow();
  });

  it('does not call onChange when onCancel is triggered', function() {
    const onChange = jasmine.createSpy('onChange');
    const { handlers } = renderField({ onChange, value: { id: 1, name: 'Wyrmwood' } });

    expect(() => handlers.onCancel()).not.toThrow();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not call onChange when focus leaves the field', function() {
    const onChange = jasmine.createSpy('onChange');
    const { handlers } = renderField({ onChange, value: { id: 1, name: 'Wyrmwood' } });
    const event = { currentTarget: { contains: () => false }, relatedTarget: null };

    expect(() => handlers.onBlur(event)).not.toThrow();
    expect(onChange).not.toHaveBeenCalled();
  });

  describe('.buildFieldBlurHandler', function() {
    it('cancels when focus moves outside the field', function() {
      const onCancel = jasmine.createSpy('onCancel');
      const outside = {};
      const event = { currentTarget: { contains: (node) => node !== outside }, relatedTarget: outside };

      buildFieldBlurHandler(onCancel)(event);

      expect(onCancel).toHaveBeenCalled();
    });

    it('cancels when focus leaves to nothing (click-away)', function() {
      const onCancel = jasmine.createSpy('onCancel');
      const event = { currentTarget: { contains: (node) => node !== null && node !== undefined }, relatedTarget: null };

      buildFieldBlurHandler(onCancel)(event);

      expect(onCancel).toHaveBeenCalled();
    });

    it('does not cancel when focus moves inside the field (e.g. to a result row)', function() {
      const onCancel = jasmine.createSpy('onCancel');
      const resultRow = {};
      const event = { currentTarget: { contains: (node) => node === resultRow }, relatedTarget: resultRow };

      buildFieldBlurHandler(onCancel)(event);

      expect(onCancel).not.toHaveBeenCalled();
    });
  });
});
