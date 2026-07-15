import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CharacterDmNotesField from '../../../../../../../../assets/js/components/resources/character/pages/elements/CharacterDmNotesField.jsx';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';

describe('CharacterDmNotesField', function() {
  const buildProps = (overrides = {}) => ({
    isFullEditor: true,
    id: 'npc-edit-private-description',
    label: 'DM Notes',
    value: 'Secret DM notes.',
    onChange: Noop.noop,
    ...overrides,
  });

  it('delegates rendering to CharacterDmNotesFieldHelper', function() {
    const html = renderToStaticMarkup(React.createElement(CharacterDmNotesField, buildProps()));
    expect(html).toContain('id="npc-edit-private-description"');
    expect(html).toContain('Secret DM notes.');
  });

  it('renders nothing when isFullEditor is false', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterDmNotesField, buildProps({ isFullEditor: false }))
    );
    expect(html).toBe('');
  });

  it('renders field errors', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterDmNotesField, buildProps({ errors: ['must not be blank'] }))
    );
    expect(html).toContain('must not be blank');
  });
});
