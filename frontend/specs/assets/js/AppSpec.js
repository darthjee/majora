import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import App from '../../../assets/js/App.jsx';

describe('App', () => {
  it('renders the application heading and description', () => {
    const markup = renderToStaticMarkup(React.createElement(App));

    expect(markup).toContain('class="app"');
    expect(markup).toContain('<h1>Majora</h1>');
    expect(markup).toContain('<p>RPG Campaign Management System</p>');
  });
});
