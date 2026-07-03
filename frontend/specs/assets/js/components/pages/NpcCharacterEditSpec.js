import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import NpcCharacterEdit from '../../../../../assets/js/components/pages/NpcCharacterEdit.jsx';
import CharacterEdit from '../../../../../assets/js/components/pages/shared/CharacterEdit.jsx';
import NpcCharacterEditController from '../../../../../assets/js/components/pages/controllers/NpcCharacterEditController.js';
import CharacterHelper from '../../../../../assets/js/components/pages/helpers/CharacterHelper.jsx';

describe('NpcCharacterEdit', function() {
  it('renders the loading state on initial render before the fetch resolves', function() {
    spyOn(NpcCharacterEditController.prototype, 'buildEffect').and.returnValue(() => () => {});
    spyOn(CharacterHelper, 'renderLoading').and.returnValue(React.createElement('div', null, 'loading'));

    const html = renderToStaticMarkup(React.createElement(NpcCharacterEdit));

    expect(html).toContain('loading');
  });

  it('passes characterKind="npcs" down to the shared CharacterEdit page', function() {
    const element = NpcCharacterEdit();

    expect(element.type).toBe(CharacterEdit);
    expect(element.props.characterKind).toBe('npcs');
  });
});
