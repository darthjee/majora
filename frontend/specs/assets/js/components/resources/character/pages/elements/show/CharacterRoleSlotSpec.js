import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CharacterRoleShow, { buildCharacterRoleField }
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/show/CharacterRoleSlot.jsx';

describe('CharacterRoleSlot', function() {
  describe('Show', function() {
    it('renders the role text', function() {
      const html = renderToStaticMarkup(React.createElement(CharacterRoleShow, { role: 'Ranger' }));

      expect(html).toContain('Ranger');
    });
  });

  describe('buildCharacterRoleField', function() {
    const variants = {
      edit: { id: 'pc-edit-role', label: 'pc_edit_page.role_label' },
    };

    it('gates on isFullEditor when alwaysShow is false', function() {
      const RoleField = buildCharacterRoleField(variants, false);
      const hiddenHtml = renderToStaticMarkup(
        React.createElement(RoleField, {
          mode: 'edit', role: 'Fighter', isFullEditor: false, handlers: {},
        }),
      );

      expect(hiddenHtml).toBe('');
    });

    it('always shows when alwaysShow is true, regardless of isFullEditor', function() {
      const RoleField = buildCharacterRoleField(variants, true);
      const handlers = { onRoleChange: jasmine.createSpy('onRoleChange') };
      const html = renderToStaticMarkup(
        React.createElement(RoleField, {
          mode: 'edit', role: 'Villain', isFullEditor: false, handlers,
        }),
      );

      expect(html).toContain('id="pc-edit-role"');
      expect(html).toContain('value="Villain"');
    });
  });
});
