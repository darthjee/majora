import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CardHoverTooltip from '../../../../../../assets/js/components/common/cards/CardHoverTooltip.jsx';

describe('CardHoverTooltip', function() {
  it('renders the trigger children on the initial render', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardHoverTooltip, { content: 'Aragorn' }, React.createElement('span', null, 'trigger'))
    );

    expect(html).toContain('trigger');
  });

  it('does not render the tooltip content on the initial render', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardHoverTooltip, { content: 'Aragorn' }, React.createElement('span', null, 'trigger'))
    );

    expect(html).not.toContain('Aragorn');
  });

  it('feeds the given content to the tooltip overlay', function() {
    const rendered = CardHoverTooltip({ content: 'Aragorn', children: React.createElement('span') });
    const tooltip = rendered.props.overlay;

    expect(tooltip.props.children).toBe('Aragorn');
  });

  it('wraps the given children as the overlay trigger', function() {
    const child = React.createElement('span', null, 'trigger');
    const rendered = CardHoverTooltip({ content: 'Aragorn', children: child });
    const wrapper = rendered.props.children;

    expect(wrapper.props.children).toBe(child);
  });
});
