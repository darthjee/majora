import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import ErrorAlert from '../../../../../assets/js/components/elements/ErrorAlert.jsx';

describe('ErrorAlert', function() {
  it('renders the error message', function() {
    const html = renderToStaticMarkup(
      React.createElement(ErrorAlert, { error: 'Something went wrong' })
    );
    expect(html).toContain('Something went wrong');
  });

  it('renders a Bootstrap danger alert', function() {
    const html = renderToStaticMarkup(
      React.createElement(ErrorAlert, { error: 'Oops' })
    );
    expect(html).toContain('alert-danger');
    expect(html).toContain('role="alert"');
  });

  it('wraps the alert in a container', function() {
    const html = renderToStaticMarkup(
      React.createElement(ErrorAlert, { error: 'Oops' })
    );
    expect(html).toContain('container');
  });
});
