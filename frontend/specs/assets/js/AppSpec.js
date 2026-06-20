import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import App from '../../../assets/js/App.jsx';

describe('App', () => {
  it('renders the application shell', () => {
    const markup = renderToStaticMarkup(React.createElement(App));

    expect(markup).toContain('class="app"');
    expect(markup).toContain('Majora');
  });
});
