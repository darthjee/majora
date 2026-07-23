import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PcCharacterItemNew from '../../../../../../../assets/js/components/resources/character/pages/PcCharacterItemNew.jsx';
import NpcCharacterItemNew from '../../../../../../../assets/js/components/resources/character/pages/NpcCharacterItemNew.jsx';
import CharacterItemNewController
  from '../../../../../../../assets/js/components/resources/character/pages/controllers/CharacterItemNewController.js';
import CharacterItemNewHelper
  from '../../../../../../../assets/js/components/resources/character/pages/helpers/CharacterItemNewHelper.jsx';
import PhotoUploadModalHelper
  from '../../../../../../../assets/js/components/common/modals/helpers/PhotoUploadModalHelper.jsx';
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

    it('renders the photo upload modal in deferred mode', function() {
      let capturedState;
      spyOn(PhotoUploadModalHelper, 'render').and.callFake((show, state) => {
        capturedState = state;
        return null;
      });

      renderToStaticMarkup(React.createElement(Component));

      expect(capturedState.deferred).toBe(true);
    });

    it('opens the upload modal via onOpenUploadModal without throwing', function() {
      let capturedHandlers;
      spyOn(CharacterItemNewHelper, 'render').and.callFake((state, handlers) => {
        capturedHandlers = handlers;
        return null;
      });

      renderToStaticMarkup(React.createElement(Component));

      expect(() => capturedHandlers.onOpenUploadModal()).not.toThrow();
    });

    it('wires onRetryPhotoUpload to controller.retryPhotoUpload with the game slug, character id, and photo file', function() {
      let capturedHandlers;
      spyOn(CharacterItemNewHelper, 'render').and.callFake((state, handlers) => {
        capturedHandlers = handlers;
        return null;
      });
      spyOn(CharacterItemNewController.prototype, 'retryPhotoUpload').and.returnValue(Promise.resolve());

      renderToStaticMarkup(React.createElement(Component));
      capturedHandlers.onRetryPhotoUpload();

      expect(CharacterItemNewController.prototype.retryPhotoUpload).toHaveBeenCalledWith(
        'demo',
        characterId,
        null,
        null,
        jasmine.objectContaining({ setStatus: jasmine.any(Function), setGameItemId: jasmine.any(Function) }),
      );
    });

    it('wires onSkipPhotoUpload to redirect to the items list using the game slug and character id', function() {
      let capturedHandlers;
      spyOn(CharacterItemNewHelper, 'render').and.callFake((state, handlers) => {
        capturedHandlers = handlers;
        return null;
      });

      renderToStaticMarkup(React.createElement(Component));
      capturedHandlers.onSkipPhotoUpload();

      expect(globalThis.window.location.hash).toBe(`/games/demo/${kind}/${characterId}/items`);
    });
  });
});
