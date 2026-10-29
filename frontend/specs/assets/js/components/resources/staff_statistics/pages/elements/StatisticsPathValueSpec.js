import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StatisticsPathValue
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/elements/StatisticsPathValue.jsx';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

describe('StatisticsPathValue', function() {
  const render = (value) => renderToStaticMarkup(React.createElement(StatisticsPathValue, { value }));

  it('renders the path monospace and truncated with the full value in the title', function() {
    const html = render('/#/games/:id/characters');

    expect(html).toContain('font-monospace');
    expect(html).toContain('text-truncate');
    expect(html).toContain('max-width:16rem');
    expect(html).toContain('title="/#/games/:id/characters"');
    expect(html).toContain('>/#/games/:id/characters</span>');
  });

  it('renders the unresolved marker as-is', function() {
    expect(render('unresolved')).toContain('title="unresolved"');
  });

  it('renders unknown for a null path', function() {
    const html = render(null);

    expect(html).toBe(`<span>${Translator.t('staff_statistics_page.visit_list.unknown')}</span>`);
    expect(html).not.toContain('title=');
  });

  it('renders unknown for a missing path', function() {
    expect(render(undefined)).toContain(Translator.t('staff_statistics_page.visit_list.unknown'));
  });
});
