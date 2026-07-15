import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CharacterRole from '../../../../../../../../assets/js/components/resources/character/pages/elements/CharacterRole.jsx';

describe('CharacterRole', function() {
  it('delegates rendering to CharacterRoleHelper', function() {
    const html = renderToStaticMarkup(React.createElement(CharacterRole, { role: 'Ranger' }));
    expect(html).toContain('Ranger');
  });

  it('renders nothing when role is absent', function() {
    const html = renderToStaticMarkup(React.createElement(CharacterRole, {}));
    expect(html).toBe('');
  });
});
