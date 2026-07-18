import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import UserAvatarBadge from '../../../../../../assets/js/components/common/badges/UserAvatarBadge.jsx';

describe('UserAvatarBadge', function() {
  it('renders the circular avatar image with the given photo url', function() {
    const html = renderToStaticMarkup(
      React.createElement(UserAvatarBadge, { photoUrl: '/avatars/1.png', displayName: 'Frodo' })
    );

    expect(html).toContain('src="/avatars/1.png"');
    expect(html).toContain('user-avatar-badge');
    expect(html).toContain('rounded-circle');
  });

  it('sets the image alt text to the display name', function() {
    const html = renderToStaticMarkup(
      React.createElement(UserAvatarBadge, { photoUrl: '/avatars/1.png', displayName: 'Frodo' })
    );

    expect(html).toContain('alt="Frodo"');
  });

  it('does not render the tooltip content on the initial render', function() {
    const html = renderToStaticMarkup(
      React.createElement(UserAvatarBadge, { photoUrl: '/avatars/1.png', displayName: 'Frodo' })
    );

    expect(html).not.toContain('role="tooltip"');
  });

  it('feeds the display name into the tooltip overlay', function() {
    const rendered = UserAvatarBadge({ photoUrl: '/avatars/1.png', displayName: 'Frodo' });

    expect(rendered.props.overlay.props.children).toBe('Frodo');
  });

  it('renders the visible trigger as the circular img', function() {
    const rendered = UserAvatarBadge({ photoUrl: '/avatars/1.png', displayName: 'Frodo' });
    const trigger = rendered.props.children;

    expect(trigger.type).toBe('img');
    expect(trigger.props.src).toBe('/avatars/1.png');
  });
});
