import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PcCharacterEdit from '../../../../../assets/js/components/pages/PcCharacterEdit.jsx';
import CharacterEdit from '../../../../../assets/js/components/pages/shared/CharacterEdit.jsx';
import PcCharacterEditController from '../../../../../assets/js/components/pages/controllers/PcCharacterEditController.js';
import CharacterHelper from '../../../../../assets/js/components/pages/helpers/CharacterHelper.jsx';

describe('PcCharacterEdit', function() {
  it('renders the loading state on initial render before the fetch resolves', function() {
    spyOn(PcCharacterEditController.prototype, 'buildEffect').and.returnValue(() => () => {});
    spyOn(CharacterHelper, 'renderLoading').and.returnValue(React.createElement('div', null, 'loading'));

    const html = renderToStaticMarkup(React.createElement(PcCharacterEdit));

    expect(html).toContain('loading');
  });

  it('passes characterKind="pcs" down to the shared CharacterEdit page', function() {
    const element = PcCharacterEdit();

    expect(element.type).toBe(CharacterEdit);
    expect(element.props.characterKind).toBe('pcs');
  });
});
