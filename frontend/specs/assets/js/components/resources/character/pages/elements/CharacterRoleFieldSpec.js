import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CharacterRoleField from '../../../../../../../../assets/js/components/resources/character/pages/elements/CharacterRoleField.jsx';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';

describe('CharacterRoleField', function() {
  const buildProps = (overrides = {}) => ({
    isFullEditor: true,
    id: 'npc-edit-role',
    label: 'Role',
    value: 'Fighter',
    onChange: Noop.noop,
    ...overrides,
  });

  it('delegates rendering to CharacterRoleFieldHelper', function() {
    const html = renderToStaticMarkup(React.createElement(CharacterRoleField, buildProps()));
    expect(html).toContain('id="npc-edit-role"');
    expect(html).toContain('value="Fighter"');
  });

  it('renders nothing when isFullEditor is false', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterRoleField, buildProps({ isFullEditor: false }))
    );
    expect(html).toBe('');
  });

  it('renders field errors', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterRoleField, buildProps({ errors: ['must not be blank'] }))
    );
    expect(html).toContain('must not be blank');
  });
});
