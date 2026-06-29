import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import CharacterEdit from '../../../../../../assets/js/components/pages/shared/CharacterEdit.jsx';
import CharacterHelper from '../../../../../../assets/js/components/pages/helpers/CharacterHelper.jsx';
import BaseCharacterEditHelper
  from '../../../../../../assets/js/components/pages/helpers/BaseCharacterEditHelper.jsx';

class FakeController {
  buildEffect() { return () => () => {}; }
  applyLoadedCharacter() {}
  submitForm() {}
}

describe('CharacterEdit', function() {
  let getParamsFromHash;
  let EditHelper;

  beforeEach(function() {
    getParamsFromHash = jasmine.createSpy('getParamsFromHash').and.returnValue({
      game_slug: 'demo',
      character_id: '1',
    });
    EditHelper = new BaseCharacterEditHelper('test', 'npc_edit_page');
  });

  it('renders the loading state on initial render before the fetch resolves', function() {
    spyOn(CharacterHelper, 'renderLoading').and.returnValue(
      React.createElement('div', null, 'loading')
    );

    const html = renderToStaticMarkup(
      React.createElement(CharacterEdit, {
        ControllerClass: FakeController,
        getParamsFromHash,
        EditHelper,
      })
    );

    expect(html).toContain('loading');
  });

  it('renders the edit form via EditHelper.render when the character is loaded', function() {
    const state = {
      name: 'Test Character',
      avatar_url: '',
      role: 'Fighter',
      description: 'A brave hero.',
      privateDescription: 'DM notes.',
      status: 'idle',
      fieldErrors: {},
    };
    const handlers = {
      onSubmit: () => {},
      onNameChange: () => {},
      onAvatarUrlChange: () => {},
      onRoleChange: () => {},
      onDescriptionChange: () => {},
      onPrivateDescriptionChange: () => {},
    };

    const html = renderToStaticMarkup(EditHelper.render(state, handlers));

    expect(html).toContain('id="test-edit-name"');
    expect(html).toContain('value="Test Character"');
  });
});
