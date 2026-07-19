import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import ConversationCountBadge from '../../../../../../assets/js/components/common/badges/ConversationCountBadge.jsx';
import Icons from '../../../../../../assets/js/utils/ui/Icons.js';

describe('ConversationCountBadge', function() {
  it('renders the given icon and text inside the visible badge', function() {
    const html = renderToStaticMarkup(
      React.createElement(ConversationCountBadge, { icon: Icons.envelope, text: 3, tooltip: 'Following 3 conversations' })
    );

    expect(html).toContain('bi-envelope');
    expect(html).toContain('3');
  });

  it('does not render the tooltip content on the initial render', function() {
    const html = renderToStaticMarkup(
      React.createElement(ConversationCountBadge, { icon: Icons.envelope, text: 3, tooltip: 'Following 3 conversations' })
    );

    expect(html).not.toContain('role="tooltip"');
  });

  it('feeds the tooltip text into the tooltip overlay', function() {
    const rendered = ConversationCountBadge({ icon: Icons.envelope, text: 3, tooltip: 'Following 3 conversations' });

    expect(rendered.props.overlay.props.children).toBe('Following 3 conversations');
  });

  it('renders the visible trigger as the icon+text Badge', function() {
    const rendered = ConversationCountBadge({ icon: Icons.envelopeFill, text: 1, tooltip: '1 unread conversations' });
    const trigger = rendered.props.children;
    const badge = trigger.props.children;

    expect(badge.props.icon).toBe(Icons.envelopeFill);
    expect(badge.props.text).toBe(1);
  });
});
