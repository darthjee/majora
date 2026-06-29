import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import TextareaField from '../../../../../assets/js/components/elements/TextareaField.jsx';

describe('TextareaField', function() {
  it('renders a label linked to the textarea via id/htmlFor', function() {
    const html = renderToStaticMarkup(
      React.createElement(TextareaField, {
        id: 'description',
        label: 'Description',
        value: '',
        onChange: () => {},
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
        onChange: () => {},
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
        onChange: () => {},
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
        onChange: () => {},
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
        onChange: () => {},
        errors: ['cannot be blank', 'is too short'],
      })
    );

    expect(html.match(/alert-danger/g).length).toBe(2);
    expect(html).toContain('cannot be blank');
    expect(html).toContain('is too short');
  });
});
