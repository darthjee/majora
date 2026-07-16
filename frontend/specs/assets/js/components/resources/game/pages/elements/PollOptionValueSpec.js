import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import PollOptionValue
  from '../../../../../../../../assets/js/components/resources/game/pages/elements/PollOptionValue.jsx';

describe('PollOptionValue', function() {
  it('renders the raw value unchanged for the text option type', function() {
    const html = renderToStaticMarkup(
      React.createElement(PollOptionValue, { optionType: 'text', value: 'The Drunken Griffin' }),
    );

    expect(html).toBe('The Drunken Griffin');
  });

  it('formats the value as a date for the date option type', function() {
    const html = renderToStaticMarkup(
      React.createElement(PollOptionValue, { optionType: 'date', value: '2026-08-01' }),
    );

    expect(html).toBe(new Date(2026, 7, 1).toLocaleDateString('en'));
  });

  it('does not shift the date by a day (negative UTC offset regression)', function() {
    const html = renderToStaticMarkup(
      React.createElement(PollOptionValue, { optionType: 'date', value: '2026-01-01' }),
    );

    expect(html).toContain('2026');
    expect(html).not.toContain('2025');
  });

  it('falls back to the raw value for an unrecognized option type', function() {
    const html = renderToStaticMarkup(
      React.createElement(PollOptionValue, { optionType: 'unknown', value: '2026-08-01' }),
    );

    expect(html).toBe('2026-08-01');
  });
});
