import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import InlineTooltip from '../../../../../../assets/js/components/common/api_tokens/InlineTooltip.jsx';

describe('InlineTooltip', function() {
  it('renders its children inline', function() {
    const html = renderToStaticMarkup(React.createElement(InlineTooltip, { content: 'tip' }, 'trigger'));

    expect(html).toContain('trigger');
    expect(html).toContain('d-inline-block');
  });
});
