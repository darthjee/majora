import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import MarkdownEditor from '../../../../../../assets/js/components/common/forms/MarkdownEditor.jsx';
import MarkdownEditorHelper from '../../../../../../assets/js/components/common/forms/helpers/MarkdownEditorHelper.jsx';

describe('MarkdownEditor', function() {
  const renderEditor = (props = {}) => {
    let capturedId;
    let capturedLabel;
    let capturedValue;
    let capturedErrors;
    let capturedState;
    let capturedHandlers;

    spyOn(MarkdownEditorHelper, 'render').and.callFake((id, label, value, errors, state, handlers) => {
      capturedId = id;
      capturedLabel = label;
      capturedValue = value;
      capturedErrors = errors;
      capturedState = state;
      capturedHandlers = handlers;
      return React.createElement('div', null, 'markdown-editor');
    });

    renderToStaticMarkup(React.createElement(MarkdownEditor, {
      id: 'description',
      label: 'Description',
      value: 'Some text.',
      onChange: jasmine.createSpy('onChange'),
      ...props,
    }));

    return {
      id: capturedId,
      label: capturedLabel,
      value: capturedValue,
      errors: capturedErrors,
      state: capturedState,
      handlers: capturedHandlers,
    };
  };

  it('forwards id, label, value and errors through to the helper', function() {
    const { id, label, value, errors } = renderEditor({ errors: ['too long'] });

    expect(id).toBe('description');
    expect(label).toBe('Description');
    expect(value).toBe('Some text.');
    expect(errors).toEqual(['too long']);
  });

  it('defaults errors to an empty array', function() {
    const { errors } = renderEditor();

    expect(errors).toEqual([]);
  });

  it('starts on the write tab', function() {
    const { state } = renderEditor();

    expect(state.activeTab).toBe('write');
  });

  it('exposes an onTabChange handler without throwing', function() {
    const { handlers } = renderEditor();

    expect(() => handlers.onTabChange('preview')).not.toThrow();
  });

  it('exposes a textarea ref, starting as null, without throwing on toolbar actions', function() {
    const { handlers } = renderEditor();

    expect(handlers.textareaRef).toEqual(jasmine.objectContaining({ current: null }));
    expect(() => handlers.onToolbarAction('bold')).not.toThrow();
  });

  it('does not call onChange when the toolbar action fires but the textarea ref is unset', function() {
    const onChange = jasmine.createSpy('onChange');
    const { handlers } = renderEditor({ onChange });

    handlers.onToolbarAction('bold');

    expect(onChange).not.toHaveBeenCalled();
  });

  it('applies the toolbar action against the live textarea and calls onChange with the new value', function() {
    const onChange = jasmine.createSpy('onChange');
    const { handlers } = renderEditor({ value: 'Hello', onChange });

    handlers.textareaRef.current = {
      selectionStart: 0,
      selectionEnd: 5,
      focus: jasmine.createSpy('focus'),
      setSelectionRange: jasmine.createSpy('setSelectionRange'),
    };

    handlers.onToolbarAction('bold');

    expect(onChange).toHaveBeenCalledWith({ target: { value: '**Hello**' } });
  });

  it('forwards onChange as the helper onChange handler', function() {
    const onChange = jasmine.createSpy('onChange');
    const { handlers } = renderEditor({ onChange });

    expect(handlers.onChange).toBe(onChange);
  });
});
