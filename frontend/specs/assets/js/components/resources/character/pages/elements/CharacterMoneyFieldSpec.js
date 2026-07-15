import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CharacterMoneyField from '../../../../../../../../assets/js/components/resources/character/pages/elements/CharacterMoneyField.jsx';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';

describe('CharacterMoneyField', function() {
  const buildProps = (overrides = {}) => ({
    isFullEditor: true,
    label: 'Money',
    money: 310,
    gameType: 'dnd',
    buttonLabel: 'Edit money',
    onOpenMoneyModal: Noop.noop,
    ...overrides,
  });

  it('delegates rendering to CharacterMoneyFieldHelper', function() {
    const html = renderToStaticMarkup(React.createElement(CharacterMoneyField, buildProps()));
    expect(html).toContain('20 CP');
    expect(html).toContain('Edit money');
  });

  it('renders nothing when isFullEditor is false', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterMoneyField, buildProps({ isFullEditor: false }))
    );
    expect(html).toBe('');
  });

  it('renders field errors', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterMoneyField, buildProps({ errors: ['must be positive'] }))
    );
    expect(html).toContain('must be positive');
  });
});
