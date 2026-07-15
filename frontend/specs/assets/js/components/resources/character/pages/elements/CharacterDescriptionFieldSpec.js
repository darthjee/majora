import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CharacterDescriptionField from '../../../../../../../../assets/js/components/resources/character/pages/elements/CharacterDescriptionField.jsx';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';

describe('CharacterDescriptionField', function() {
  const buildProps = (overrides = {}) => ({
    id: 'npc-edit-description',
    label: 'Description',
    value: 'A brave warrior.',
    onChange: Noop.noop,
    ...overrides,
  });

  it('delegates rendering to CharacterDescriptionFieldHelper', function() {
    const html = renderToStaticMarkup(React.createElement(CharacterDescriptionField, buildProps()));
    expect(html).toContain('id="npc-edit-description"');
    expect(html).toContain('A brave warrior.');
  });

  it('renders field errors', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterDescriptionField, buildProps({ errors: ['must not be blank'] }))
    );
    expect(html).toContain('must not be blank');
  });
});
