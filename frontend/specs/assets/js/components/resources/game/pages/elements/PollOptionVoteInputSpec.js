import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import PollOptionVoteInput
  from '../../../../../../../../assets/js/components/resources/game/pages/elements/PollOptionVoteInput.jsx';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';

describe('PollOptionVoteInput', function() {
  it('renders a radio input for the single poll type', function() {
    const html = renderToStaticMarkup(
      React.createElement(PollOptionVoteInput, {
        id: 'opt-1',
        dataTestId: 'opt-1',
        pollType: 'single',
        name: 'game-poll-1',
        checked: false,
        disabled: false,
        onChange: Noop.noop,
      }),
    );

    expect(html).toContain('type="radio"');
    expect(html).toContain('name="game-poll-1"');
    expect(html).toContain('id="opt-1"');
    expect(html).toContain('data-testid="opt-1"');
  });

  it('renders a checkbox input for the multiple poll type', function() {
    const html = renderToStaticMarkup(
      React.createElement(PollOptionVoteInput, {
        id: 'opt-1',
        dataTestId: 'opt-1',
        pollType: 'multiple',
        name: 'game-poll-1',
        checked: false,
        disabled: false,
        onChange: Noop.noop,
      }),
    );

    expect(html).toContain('type="checkbox"');
  });

  it('renders as checked when the option is selected', function() {
    const html = renderToStaticMarkup(
      React.createElement(PollOptionVoteInput, {
        id: 'opt-1',
        dataTestId: 'opt-1',
        pollType: 'single',
        name: 'game-poll-1',
        checked: true,
        disabled: false,
        onChange: Noop.noop,
      }),
    );

    expect(html).toContain('checked=""');
  });

  it('renders as disabled when the viewer cannot vote', function() {
    const html = renderToStaticMarkup(
      React.createElement(PollOptionVoteInput, {
        id: 'opt-1',
        dataTestId: 'opt-1',
        pollType: 'single',
        name: 'game-poll-1',
        checked: false,
        disabled: true,
        onChange: Noop.noop,
      }),
    );

    expect(html).toContain('disabled=""');
  });
});
