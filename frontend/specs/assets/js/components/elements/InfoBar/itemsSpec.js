import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import InfoBar from '../../../../../../assets/js/components/elements/InfoBar.jsx';

describe('InfoBar', function() {
  it('renders each given item label inside the info-overlay container', function() {
    const html = renderToStaticMarkup(
      React.createElement(InfoBar, {
        items: [
          { key: 'first', label: 'First Item' },
          { key: 'second', label: 'Second Item' },
        ],
      })
    );

    expect(html).toContain('info-overlay-item');
    expect(html).toContain('First Item');
    expect(html).toContain('Second Item');
  });

  it('falls back to the item index as the React key when no key is given', function() {
    const html = renderToStaticMarkup(
      React.createElement(InfoBar, {
        items: [{ label: 'Only Item' }],
      })
    );

    expect(html).toContain('Only Item');
  });
});
