import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import SingleResourcePickerField
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
      resource: 'source',
      maxEntries: 4,
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

    expect(state.resource).toBe('source');
    expect(state.maxEntries).toBe(4);
    expect(state.value).toBeNull();
    expect(state.label).toBe('Source');
    expect(state.searchPlaceholder).toBe('Search sources...');
    expect(state.searching).toBe(false);
  });

  it('calls onChange with the picked item when onSelect is triggered', function() {
    const onChange = jasmine.createSpy('onChange');
    const { handlers } = renderField({ onChange });
    const item = { id: 1, name: 'Wyrmwood' };

    handlers.onSelect(item);

    expect(onChange).toHaveBeenCalledWith(item);
  });

  it('does not throw when onReopenSearch is triggered', function() {
    const { handlers } = renderField();

    expect(() => handlers.onReopenSearch()).not.toThrow();
  });
});
