import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CharacterInfo from '../../../../../assets/js/components/elements/CharacterInfo.jsx';

describe('CharacterInfo', function() {
  it('renders the character name', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterInfo, { name: 'Aragorn' })
    );
    expect(html).toContain('Aragorn');
  });

  it('renders class and level when both are present', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterInfo, { name: 'Aragorn', character_class: 'Ranger', level: 10 })
    );
    expect(html).toContain('Ranger');
    expect(html).toContain('10');
  });

  it('renders class without level when level is null', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterInfo, { name: 'Aragorn', character_class: 'Ranger', level: null })
    );
    expect(html).toContain('Ranger');
    expect(html).not.toContain('Level');
  });

  it('does not render class section when character_class is absent', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterInfo, { name: 'Aragorn' })
    );
    expect(html).not.toContain('Class:');
  });

  it('renders description when present', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterInfo, { name: 'Aragorn', description: 'The future king.' })
    );
    expect(html).toContain('The future king.');
  });

  it('does not render description paragraph when description is empty', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterInfo, { name: 'Aragorn', description: '' })
    );
    expect(html).not.toContain('The future king.');
  });
});
