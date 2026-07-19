import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import RemovableOptionRow from '../../../../../../assets/js/components/common/forms/RemovableOptionRow.jsx';
import Noop from '../../../../../../assets/js/utils/Noop.js';

describe('RemovableOptionRow', function() {
  const baseProps = {
    id: 'game-poll-new-option-0',
    testId: 'game-poll-new-option-0',
    removeTestId: 'game-poll-new-option-remove-0',
    optionType: 'text',
    onChange: Noop.noop,
    onRemove: Noop.noop,
  };

  it('renders the type-aware option input', function() {
    const html = renderToStaticMarkup(
      React.createElement(RemovableOptionRow, { ...baseProps, value: 'Griffin', isLast: false }),
    );

    expect(html).toContain('id="game-poll-new-option-0"');
    expect(html).toContain('data-testid="game-poll-new-option-0"');
    expect(html).toContain('value="Griffin"');
  });

  it('renders the remove button when not the trailing blank row', function() {
    const html = renderToStaticMarkup(
      React.createElement(RemovableOptionRow, { ...baseProps, value: 'Griffin', isLast: true }),
    );

    expect(html).toContain('data-testid="game-poll-new-option-remove-0"');
  });

  it('renders the remove button for a non-last blank row', function() {
    const html = renderToStaticMarkup(
      React.createElement(RemovableOptionRow, { ...baseProps, value: '', isLast: false }),
    );

    expect(html).toContain('data-testid="game-poll-new-option-remove-0"');
  });

  it('hides the remove button for the trailing blank row', function() {
    const html = renderToStaticMarkup(
      React.createElement(RemovableOptionRow, { ...baseProps, value: '', isLast: true }),
    );

    expect(html).not.toContain('data-testid="game-poll-new-option-remove-0"');
  });

  it('hides the remove button for a whitespace-only trailing row', function() {
    const html = renderToStaticMarkup(
      React.createElement(RemovableOptionRow, { ...baseProps, value: '   ', isLast: true }),
    );

    expect(html).not.toContain('data-testid="game-poll-new-option-remove-0"');
  });

  it('forwards the date option type to the underlying input', function() {
    const html = renderToStaticMarkup(
      React.createElement(RemovableOptionRow, {
        ...baseProps, optionType: 'date', value: '2026-08-01', isLast: false,
      }),
    );

    expect(html).toContain('type="date"');
  });
});
