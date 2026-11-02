import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import AppErrorBoundary from '../../../../../../assets/js/components/common/misc/AppErrorBoundary.jsx';
import AppErrorFallback from '../../../../../../assets/js/components/common/misc/AppErrorFallback.jsx';
import TranslationEvents from '../../../../../../assets/js/i18n/TranslationEvents.js';

describe('AppErrorBoundary', function() {
  function build(props = {}) {
    return new AppErrorBoundary({ children: React.createElement('p', null, 'child'), ...props });
  }

  it('renders its children normally', function() {
    const html = renderToStaticMarkup(
      React.createElement(AppErrorBoundary, null, React.createElement('p', null, 'All good')),
    );

    expect(html).toBe('<p>All good</p>');
  });

  it('switches to the error state when a descendant throws', function() {
    expect(AppErrorBoundary.getDerivedStateFromError(new Error('boom'))).toEqual({ hasError: true });
  });

  it('renders the fallback with the translated texts once an error was caught', function() {
    const boundary = build();
    boundary.state = { hasError: true };

    const html = renderToStaticMarkup(boundary.render());

    expect(html).toContain('Something went wrong');
    expect(html).toContain('An unexpected error occurred while rendering this page.');
    expect(html).toContain('Reload page');
    expect(html).not.toContain('child');
  });

  it('wires the injected reload to the fallback', function() {
    const reload = jasmine.createSpy('reload');
    const boundary = build({ reload });
    boundary.state = { hasError: true };

    const element = boundary.render();
    element.props.onReload();

    expect(element.type).toBe(AppErrorFallback);
    expect(reload).toHaveBeenCalled();
  });

  it('defaults the reload to reloading the page', function() {
    const boundary = build();
    boundary.state = { hasError: true };
    const originalLocation = globalThis.location;
    const reload = jasmine.createSpy('location.reload');

    Object.defineProperty(globalThis, 'location', { value: { reload }, configurable: true, writable: true });

    try {
      boundary.render().props.onReload();
    } finally {
      Object.defineProperty(globalThis, 'location', {
        value: originalLocation, configurable: true, writable: true,
      });
    }

    expect(reload).toHaveBeenCalled();
  });

  it('logs the error and the component stack', function() {
    spyOn(console, 'error');
    const error = new Error('boom');

    build().componentDidCatch(error, { componentStack: '\n    at Broken' });

    expect(console.error).toHaveBeenCalledWith(
      'AppErrorBoundary caught a render error', error, '\n    at Broken',
    );
  });

  it('subscribes to translation loads while mounted and re-renders on them', function() {
    const boundary = build();
    spyOn(TranslationEvents, 'subscribe');
    spyOn(TranslationEvents, 'unsubscribe');
    spyOn(boundary, 'forceUpdate');

    boundary.componentDidMount();
    const handler = TranslationEvents.subscribe.calls.mostRecent().args[0];
    handler();
    boundary.componentWillUnmount();

    expect(boundary.forceUpdate).toHaveBeenCalledTimes(1);
    expect(TranslationEvents.unsubscribe).toHaveBeenCalledWith(handler);
  });
});
