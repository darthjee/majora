import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import MarkdownContent
  from '../../../../../../assets/js/components/common/misc/MarkdownContent.jsx';

describe('MarkdownContent', function() {
  const render = (text) => renderToStaticMarkup(React.createElement(MarkdownContent, null, text));

  it('renders a GFM table inside a responsive wrapper', function() {
    const html = render('| A | B |\n| --- | --- |\n| 1 | 2 |');

    expect(html).toContain('<div class="table-responsive">');
    expect(html).toContain('<table class="table table-sm table-bordered"');
    expect(html).toContain('<th>A</th>');
    expect(html).toContain('<td>1</td>');
  });

  it('renders a table following a paragraph', function() {
    const html = render('Checks:\n\n| Skill | DC |\n|  :---  |  ---:  |\n| Stealth | 15 |');

    expect(html).toContain('<table');
    expect(html).toContain('Stealth');
  });

  it('does not render a table when divider cell count differs', function() {
    expect(render('| A | B |\n| --- |\n| 1 | 2 |')).not.toContain('<table');
  });

  it('keeps soft line breaks as br', function() {
    expect(render('Line one.\nLine two.')).toContain('<br');
  });

  it('does not render javascript: hrefs', function() {
    expect(render('[x](javascript:alert(1))')).not.toContain('javascript:');
  });

  it('does not render raw html elements', function() {
    expect(render('<script>alert(1)</script>')).not.toContain('<script');
  });
});
