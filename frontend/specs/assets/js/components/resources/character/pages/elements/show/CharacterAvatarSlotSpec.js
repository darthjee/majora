import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CharacterAvatarSlot
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/show/CharacterAvatarSlot.jsx';

describe('CharacterAvatarSlot', function() {
  describe('Show', function() {
    it('delegates to CharacterAvatarHelper with the merged context as the character', function() {
      const handlers = { onOpenUploadModal: jasmine.createSpy('onOpenUploadModal') };
      const html = renderToStaticMarkup(
        React.createElement(CharacterAvatarSlot.Show, {
          name: 'Aragorn', is_pc: true, slain: false, can_edit: true, handlers,
        }),
      );

      expect(html).toContain('default_character.png');
      expect(html).toContain('actions-overlay-button');
    });

    it('falls back to an empty handlers object when none is given', function() {
      expect(() => renderToStaticMarkup(
        React.createElement(CharacterAvatarSlot.Show, { name: 'Aragorn', is_pc: true }),
      )).not.toThrow();
    });
  });

  describe('New/Edit', function() {
    it('is the same component for both New and Edit', function() {
      expect(CharacterAvatarSlot.New).toBe(CharacterAvatarSlot.Edit);
    });

    it('renders an editable avatar dimmed when hidden is true', function() {
      const handlers = { onOpenUploadModal: jasmine.createSpy('onOpenUploadModal') };
      const html = renderToStaticMarkup(
        React.createElement(CharacterAvatarSlot.Edit, {
          profile_photo_path: null, name: 'Grix', hidden: true, handlers,
        }),
      );

      expect(html).toContain('photo-hidden');
    });

    it('defaults hidden to false (a no-op for PCs, which never expose a hidden toggle)', function() {
      const handlers = { onOpenUploadModal: jasmine.createSpy('onOpenUploadModal') };
      const html = renderToStaticMarkup(
        React.createElement(CharacterAvatarSlot.Edit, { profile_photo_path: null, name: 'Aragorn', handlers }),
      );

      expect(html).not.toContain('photo-hidden');
    });
  });
});
