import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import InfoBadgeList from '../../../../../../assets/js/components/common/InfoBadgeList.jsx';

describe('InfoBadgeList', function() {
  it('renders null when items is empty', function() {
    const html = renderToStaticMarkup(React.createElement(InfoBadgeList, { items: [] }));

    expect(html).toBe('');
  });

  it('renders null when items is omitted', function() {
    const html = renderToStaticMarkup(React.createElement(InfoBadgeList, {}));

    expect(html).toBe('');
  });

  it('renders each item icon and text', function() {
    const html = renderToStaticMarkup(
      React.createElement(InfoBadgeList, {
        items: [
          { icon: 'bi-skull-fill', text: 'Slain', variant: 'danger' },
          { icon: 'bi-heart', text: 'Known as Alive', variant: 'success' },
        ],
      })
    );

    expect(html).toContain('bi-skull-fill');
    expect(html).toContain('Slain');
    expect(html).toContain('bi-heart');
    expect(html).toContain('Known as Alive');
  });

  it('applies the text color class matching each item variant', function() {
    const html = renderToStaticMarkup(
      React.createElement(InfoBadgeList, {
        items: [{ icon: 'bi-skull-fill', text: 'Slain', variant: 'danger' }],
      })
    );

    expect(html).toContain('text-danger');
  });

  it('applies the near-white neutral color class when an item has no variant', function() {
    const html = renderToStaticMarkup(
      React.createElement(InfoBadgeList, {
        items: [{ icon: 'bi-emoji-expressionless-fill', text: 'Neutral', variant: null }],
      })
    );

    expect(html).toContain('info-badge-list-item-neutral');
    expect(html).not.toContain('text-muted');
  });
});
