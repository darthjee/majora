import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import FormField from '../../../../../assets/js/components/elements/FormField.jsx';

describe('FormField', function() {
  it('renders a label linked to the input via id/htmlFor', function() {
    const html = renderToStaticMarkup(
      React.createElement(FormField, {
        id: 'username',
        type: 'text',
        label: 'Username',
        value: '',
        onChange: () => {},
      })
    );

    expect(html).toContain('id="username"');
    expect(html).toContain('for="username"');
    expect(html).toContain('Username');
  });

  it('renders the input with the given type and value', function() {
    const html = renderToStaticMarkup(
      React.createElement(FormField, {
        id: 'password',
        type: 'password',
        label: 'Password',
        value: 'secret',
        onChange: () => {},
      })
    );

    expect(html).toContain('type="password"');
    expect(html).toContain('value="secret"');
  });

  it('wraps the field in the standard mb-3 spacing class', function() {
    const html = renderToStaticMarkup(
      React.createElement(FormField, {
        id: 'email',
        type: 'email',
        label: 'Email',
        value: '',
        onChange: () => {},
      })
    );

    expect(html).toContain('class="mb-3"');
    expect(html).toContain('class="form-control"');
  });
});
