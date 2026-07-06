import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import ConditionalComponent from '../../../../../assets/js/components/elements/ConditionalComponent.jsx';

describe('ConditionalComponent', function() {
  it('renders the children when render is true', function() {
    const html = renderToStaticMarkup(
      React.createElement(
        ConditionalComponent,
        { render: true },
        React.createElement('span', null, 'Visible')
      )
    );
    expect(html).toContain('Visible');
  });

  it('renders nothing when render is false', function() {
    const html = renderToStaticMarkup(
      React.createElement(
        ConditionalComponent,
        { render: false },
        React.createElement('span', null, 'Hidden')
      )
    );
    expect(html).toBe('');
  });
});
