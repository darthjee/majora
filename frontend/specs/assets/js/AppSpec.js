import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import App from '../../../assets/js/App.jsx';
import AccessRouteConfigStore from '../../../assets/js/utils/access/AccessRouteConfigStore.js';

describe('App', () => {
  beforeEach(function() {
    // Rendering App constructs an AppController, which triggers a real (unmocked)
    // AccessRouteConfigStore.load() boot fetch; stub it so this shell-render smoke
    // test doesn't leak a pending fetch/mutated singleton state into other specs.
    spyOn(AccessRouteConfigStore, 'load');
  });

  it('renders the application shell', () => {
    const markup = renderToStaticMarkup(React.createElement(App));

    expect(markup).toContain('class="app"');
    expect(markup).toContain('Majora');
  });
});
