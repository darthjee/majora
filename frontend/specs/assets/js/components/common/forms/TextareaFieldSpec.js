import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import TextareaField from '../../../../../../assets/js/components/common/forms/TextareaField.jsx';
import Noop from '../../../../../../assets/js/utils/Noop.js';

describe('TextareaField', function() {
  it('renders a label linked to the textarea via id/htmlFor', function() {
    const html = renderToStaticMarkup(
      React.createElement(TextareaField, {
        id: 'description',
        label: 'Description',
        value: '',
        onChange: Noop.noop,
      })
    );

    expect(html).toContain('id="description"');
    expect(html).toContain('for="description"');
    expect(html).toContain('Description');
  });

  it('renders the textarea with the given value as text content', function() {
    const html = renderToStaticMarkup(
      React.createElement(TextareaField, {
        id: 'notes',
        label: 'Notes',
        value: 'Some multi-line text.',
        onChange: Noop.noop,
      })
    );

    expect(html).toContain('<textarea');
    expect(html).toContain('Some multi-line text.');
  });

  it('wraps the field in the standard mb-3 spacing class', function() {
    const html = renderToStaticMarkup(
      React.createElement(TextareaField, {
        id: 'description',
        label: 'Description',
        value: '',
        onChange: Noop.noop,
      })
    );

    expect(html).toContain('class="mb-3"');
    expect(html).toContain('class="form-control"');
  });

  it('renders nothing extra when errors is empty', function() {
    const html = renderToStaticMarkup(
      React.createElement(TextareaField, {
        id: 'description',
        label: 'Description',
        value: '',
        onChange: Noop.noop,
      })
    );

    expect(html).not.toContain('alert-danger');
  });

  it('renders one alert per message when errors are provided', function() {
    const html = renderToStaticMarkup(
      React.createElement(TextareaField, {
        id: 'description',
        label: 'Description',
        value: '',
        onChange: Noop.noop,
        errors: ['cannot be blank', 'is too short'],
      })
    );

    expect(html.match(/alert-danger/g).length).toBe(2);
    expect(html).toContain('cannot be blank');
    expect(html).toContain('is too short');
  });
});
