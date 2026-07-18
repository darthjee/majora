import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import ResilienceIndicator from '../../../../../../assets/js/components/common/misc/ResilienceIndicator.jsx';

describe('ResilienceIndicator', function() {
  it('renders the resilience indicator icon', function() {
    const html = renderToStaticMarkup(React.createElement(ResilienceIndicator));

    expect(html).toContain('data-testid="resilience-indicator"');
  });

  it('renders without throwing', function() {
    expect(() => renderToStaticMarkup(React.createElement(ResilienceIndicator))).not.toThrow();
  });
});
