import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import App from '../../../assets/js/App.jsx';
import { createAppElement, queryClient } from '../../../assets/js/main.jsx';

describe('main', () => {
  it('builds the application tree with the shared query client', () => {
    const appElement = createAppElement();
    const providerElement = appElement.props.children;

    expect(appElement.type).toBe(React.StrictMode);
    expect(providerElement.type).toBe(QueryClientProvider);
    expect(providerElement.props.client).toBe(queryClient);
    expect(providerElement.props.children.type).toBe(App);
  });
});
