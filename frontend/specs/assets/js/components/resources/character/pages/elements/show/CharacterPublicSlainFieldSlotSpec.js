import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CharacterPublicSlainFieldSlot
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/show/CharacterPublicSlainFieldSlot.jsx';

describe('CharacterPublicSlainFieldSlot', function() {
  it('renders the public-slain checkbox', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterPublicSlainFieldSlot, { publicSlain: false, handlers: {} }),
    );

    expect(html).toContain('id="npc-edit-public-slain"');
    expect(html).toContain('type="checkbox"');
  });

  it('renders checked when publicSlain is true', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterPublicSlainFieldSlot, { publicSlain: true, handlers: {} }),
    );

    expect(html).toContain('checked=""');
  });

  it('wires onChange to handlers.onPublicSlainChange', function() {
    const handlers = { onPublicSlainChange: jasmine.createSpy('onPublicSlainChange') };
    const element = CharacterPublicSlainFieldSlot({ publicSlain: false, handlers });

    expect(element.props.children[0].props.onChange).toBe(handlers.onPublicSlainChange);
  });
});
