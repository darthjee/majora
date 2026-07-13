import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import TooltipBadge from '../../../../../../assets/js/components/common/TooltipBadge.jsx';
import Badge from '../../../../../../assets/js/components/common/Badge.jsx';

describe('TooltipBadge', function() {
  it('renders the visible badge with the given icon', function() {
    const html = renderToStaticMarkup(
      React.createElement(TooltipBadge, { icon: 'bi-info-circle-fill', items: [] })
    );

    expect(html).toContain('bi-info-circle-fill');
  });

  it('does not render the tooltip content on the initial render', function() {
    const html = renderToStaticMarkup(
      React.createElement(TooltipBadge, {
        icon: 'bi-info-circle-fill',
        items: [{ icon: 'bi-skull-fill', text: 'Slain', variant: 'danger' }],
      })
    );

    expect(html).not.toContain('Slain');
  });

  it('renders the visible trigger through Badge', function() {
    const rendered = TooltipBadge({ icon: 'bi-info-circle-fill', items: [] });
    const trigger = rendered.props.children;

    expect(trigger.props.children.type).toBe(Badge);
    expect(trigger.props.children.props.icon).toBe('bi-info-circle-fill');
  });
});
