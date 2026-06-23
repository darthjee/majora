import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import FieldErrors from '../../../../../assets/js/components/elements/FieldErrors.jsx';

describe('FieldErrors', function() {
  it('renders nothing when errors is empty', function() {
    const html = renderToStaticMarkup(
      React.createElement(FieldErrors, { errors: [] })
    );

    expect(html).not.toContain('alert-danger');
  });

  it('renders one alert per message when errors are provided', function() {
    const html = renderToStaticMarkup(
      React.createElement(FieldErrors, { errors: ['must be positive', 'must be an integer'] })
    );

    expect(html.match(/alert-danger/g).length).toBe(2);
    expect(html).toContain('must be positive');
    expect(html).toContain('must be an integer');
  });
});
