import React from 'react';
import App from '../../../assets/js/App.jsx';
import AppErrorBoundary from '../../../assets/js/components/common/misc/AppErrorBoundary.jsx';
import { createAppElement } from '../../../assets/js/main.jsx';

describe('main', () => {
  it('builds the application tree', () => {
    const appElement = createAppElement();
    const boundary = appElement.props.children;
    const appRoot = boundary.props.children;

    expect(appElement.type).toBe(React.StrictMode);
    expect(boundary.type).toBe(AppErrorBoundary);
    expect(appRoot.type).toBe(App);
  });
});
