import React from 'react';
import App from '../../../assets/js/App.jsx';
import { createAppElement } from '../../../assets/js/main.jsx';

describe('main', () => {
  it('builds the application tree', () => {
    const appElement = createAppElement();
    const appRoot = appElement.props.children;

    expect(appElement.type).toBe(React.StrictMode);
    expect(appRoot.type).toBe(App);
  });
});
