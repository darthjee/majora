import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PcCharacterEdit from '../../../../../assets/js/components/pages/PcCharacterEdit.jsx';
import NpcCharacterEdit from '../../../../../assets/js/components/pages/NpcCharacterEdit.jsx';
import CharacterEdit from '../../../../../assets/js/components/pages/shared/CharacterEdit.jsx';
import PcCharacterEditController from '../../../../../assets/js/components/pages/controllers/PcCharacterEditController.js';
import NpcCharacterEditController from '../../../../../assets/js/components/pages/controllers/NpcCharacterEditController.js';
import CharacterHelper from '../../../../../assets/js/components/pages/helpers/CharacterHelper.jsx';
import { stubBuildEffect, stubRenderLoading } from '../../../../support/controllerStubs.js';

const KINDS = [
  {
    label: 'PcCharacterEdit',
    Component: PcCharacterEdit,
    Controller: PcCharacterEditController,
    characterKind: 'pcs',
  },
  {
    label: 'NpcCharacterEdit',
    Component: NpcCharacterEdit,
    Controller: NpcCharacterEditController,
    characterKind: 'npcs',
  },
];

KINDS.forEach(({ label, Component, Controller, characterKind }) => {
  describe(label, function() {
    it('renders the loading state on initial render before the fetch resolves', function() {
      stubBuildEffect(Controller);
      stubRenderLoading(CharacterHelper);

      const html = renderToStaticMarkup(React.createElement(Component));

      expect(html).toContain('loading');
    });

    it(`passes characterKind="${characterKind}" down to the shared CharacterEdit page`, function() {
      const element = Component();

      expect(element.type).toBe(CharacterEdit);
      expect(element.props.characterKind).toBe(characterKind);
    });
  });
});
