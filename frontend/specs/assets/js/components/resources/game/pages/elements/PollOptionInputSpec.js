import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import PollOptionInput
  from '../../../../../../../../assets/js/components/resources/game/pages/elements/PollOptionInput.jsx';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';

describe('PollOptionInput', function() {
  it('renders a text input for the text option type', function() {
    const html = renderToStaticMarkup(
      React.createElement(PollOptionInput, {
        id: 'option-0', dataTestId: 'option-0', optionType: 'text', value: 'Griffin', onChange: Noop.noop,
      }),
    );

    expect(html).toContain('type="text"');
    expect(html).toContain('id="option-0"');
    expect(html).toContain('data-testid="option-0"');
    expect(html).toContain('value="Griffin"');
  });

  it('renders a date input for the date option type', function() {
    const html = renderToStaticMarkup(
      React.createElement(PollOptionInput, {
        id: 'option-0', dataTestId: 'option-0', optionType: 'date', value: '2026-08-01', onChange: Noop.noop,
      }),
    );

    expect(html).toContain('type="date"');
    expect(html).toContain('value="2026-08-01"');
  });

  it('falls back to a text input for an unrecognized option type', function() {
    const html = renderToStaticMarkup(
      React.createElement(PollOptionInput, {
        id: 'option-0', dataTestId: 'option-0', optionType: 'unknown', value: 'Griffin', onChange: Noop.noop,
      }),
    );

    expect(html).toContain('type="text"');
  });

  it('applies the form-control class', function() {
    const html = renderToStaticMarkup(
      React.createElement(PollOptionInput, {
        id: 'option-0', dataTestId: 'option-0', optionType: 'text', value: '', onChange: Noop.noop,
      }),
    );

    expect(html).toContain('form-control');
  });
});
