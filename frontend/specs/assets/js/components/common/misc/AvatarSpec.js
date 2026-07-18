import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import Avatar from '../../../../../../assets/js/components/common/misc/Avatar.jsx';

describe('Avatar', function() {
  it('renders an img element when a URL is provided', function() {
    const html = renderToStaticMarkup(
      React.createElement(Avatar, { url: 'http://example.com/avatar.png', alt: 'Jane Doe' })
    );
    expect(html).toContain('<img');
    expect(html).toContain('http://example.com/avatar.png');
    expect(html).toContain('alt="Jane Doe"');
  });

  it('applies the avatar-photo class', function() {
    const html = renderToStaticMarkup(
      React.createElement(Avatar, { url: 'http://example.com/avatar.png', alt: 'Jane Doe' })
    );
    expect(html).toContain('avatar-photo');
  });

  it('renders the default avatar photo when url is null', function() {
    const html = renderToStaticMarkup(
      React.createElement(Avatar, { url: null, alt: 'Jane Doe' })
    );
    expect(html).toContain('<img');
    expect(html).toContain('default_avatar.png');
  });

  it('renders the default avatar photo when url is undefined', function() {
    const html = renderToStaticMarkup(
      React.createElement(Avatar, { alt: 'Jane Doe' })
    );
    expect(html).toContain('<img');
    expect(html).toContain('default_avatar.png');
  });

  it('applies the avatar-photo class to the default photo', function() {
    const html = renderToStaticMarkup(
      React.createElement(Avatar, { url: null, alt: 'Jane Doe' })
    );
    expect(html).toContain('avatar-photo');
  });
});
