import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CharacterDescriptionShow, { buildCharacterDescriptionField }
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/show/CharacterDescriptionSlot.jsx';

describe('CharacterDescriptionSlot', function() {
  describe('Show', function() {
    it('renders the public_description text', function() {
      const html = renderToStaticMarkup(
        React.createElement(CharacterDescriptionShow, { public_description: 'A brave hero.' }),
      );

      expect(html).toContain('A brave hero.');
    });
  });

  describe('buildCharacterDescriptionField', function() {
    it('always renders (visible regardless of editor kind)', function() {
      const DescriptionField = buildCharacterDescriptionField({
        edit: { id: 'pc-edit-description', label: 'pc_edit_page.description_label' },
      });
      const handlers = { onDescriptionChange: jasmine.createSpy('onDescriptionChange') };
      const html = renderToStaticMarkup(
        React.createElement(DescriptionField, {
          mode: 'edit', description: 'A brave hero.', handlers,
        }),
      );

      expect(html).toContain('id="pc-edit-description"');
      expect(html).toContain('>A brave hero.</textarea>');
    });
  });
});
