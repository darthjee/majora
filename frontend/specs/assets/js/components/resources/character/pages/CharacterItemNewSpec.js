import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PcCharacterItemNew from '../../../../../../../assets/js/components/resources/character/pages/PcCharacterItemNew.jsx';
import NpcCharacterItemNew from '../../../../../../../assets/js/components/resources/character/pages/NpcCharacterItemNew.jsx';
import CharacterItemNewController
  from '../../../../../../../assets/js/components/resources/character/pages/controllers/CharacterItemNewController.js';
import { stubBuildEffect } from '../../../../../../support/controllerStubs.js';

const KINDS = [
  { label: 'PcCharacterItemNew', Component: PcCharacterItemNew, kind: 'pcs', characterId: '7' },
  { label: 'NpcCharacterItemNew', Component: NpcCharacterItemNew, kind: 'npcs', characterId: '9' },
];

KINDS.forEach(({
  label, Component, kind, characterId,
}) => {
  describe(label, function() {
    let originalWindow;

    beforeEach(function() {
      originalWindow = globalThis.window;
      globalThis.window = { location: { hash: `#/games/demo/${kind}/${characterId}/items/new` } };
      stubBuildEffect(CharacterItemNewController);
    });

    afterEach(function() {
      globalThis.window = originalWindow;
    });

    it('renders the item creation form', function() {
      const html = renderToStaticMarkup(React.createElement(Component));

      expect(html).toContain('id="character-item-new-name"');
      expect(html).toContain('id="character-item-new-description"');
      expect(html).toContain('id="character-item-new-hidden"');
    });

    it('renders the submit button', function() {
      const html = renderToStaticMarkup(React.createElement(Component));

      expect(html).toContain('type="submit"');
    });
  });
});
