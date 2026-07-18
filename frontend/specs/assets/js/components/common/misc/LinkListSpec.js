import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import LinkList from '../../../../../../assets/js/components/common/misc/LinkList.jsx';
import { buildLink } from '../../../../../support/factories.js';

describe('LinkList', function() {
  const links = [
    buildLink({ text: 'Wiki', url: 'https://example.com/wiki' }),
    buildLink({ text: 'Discord', url: 'https://discord.gg/example' }),
  ];

  it('renders each link URL', function() {
    const html = renderToStaticMarkup(
      React.createElement(LinkList, { links })
    );
    expect(html).toContain('href="https://example.com/wiki"');
    expect(html).toContain('href="https://discord.gg/example"');
  });

  it('renders each link anchor text', function() {
    const html = renderToStaticMarkup(
      React.createElement(LinkList, { links })
    );
    expect(html).toContain('Wiki');
    expect(html).toContain('Discord');
  });

  it('sets target="_blank" on each anchor', function() {
    const html = renderToStaticMarkup(
      React.createElement(LinkList, { links })
    );
    expect(html).toContain('target="_blank"');
  });

  it('sets rel="noreferrer" on each anchor', function() {
    const html = renderToStaticMarkup(
      React.createElement(LinkList, { links })
    );
    expect(html).toContain('rel="noreferrer"');
  });

  it('renders each link as a card', function() {
    const html = renderToStaticMarkup(
      React.createElement(LinkList, { links })
    );
    expect(html).toContain('class="card mb-2"');
  });

  it('renders a chain icon before each link', function() {
    const html = renderToStaticMarkup(
      React.createElement(LinkList, { links })
    );
    expect(html).toContain('bi-link-45deg');
  });

  it('renders nothing when links is an empty array', function() {
    const html = renderToStaticMarkup(
      React.createElement(LinkList, { links: [] })
    );
    expect(html).toBe('');
  });

  it('renders nothing when links is undefined', function() {
    const html = renderToStaticMarkup(
      React.createElement(LinkList, {})
    );
    expect(html).toBe('');
  });

  it('renders the type-specific icon image when link_type is recognized', function() {
    const html = renderToStaticMarkup(
      React.createElement(LinkList, {
        links: [buildLink({ text: 'Loot', url: 'https://example.com/loot', link_type: 'lootstudio' })],
      })
    );
    expect(html).toContain('lootstudio.png');
    expect(html).not.toContain('bi-link-45deg');
  });

  it('renders the chain icon when link_type is unset', function() {
    const html = renderToStaticMarkup(
      React.createElement(LinkList, {
        links: [buildLink({ text: 'Loot', url: 'https://example.com/loot' })],
      })
    );
    expect(html).toContain('bi-link-45deg');
  });

  it('falls back to the chain icon when link_type is unrecognized', function() {
    const html = renderToStaticMarkup(
      React.createElement(LinkList, {
        links: [buildLink({ text: 'Loot', url: 'https://example.com/loot', link_type: 'unknown_type' })],
      })
    );
    expect(html).toContain('bi-link-45deg');
    expect(html).not.toContain('unknown_type.png');
  });
});
