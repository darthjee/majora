import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PcCharacterDocuments from '../../../../../../../assets/js/components/resources/character/pages/PcCharacterDocuments.jsx';
import NpcCharacterDocuments from '../../../../../../../assets/js/components/resources/character/pages/NpcCharacterDocuments.jsx';
import CharacterDocumentsHelper
  from '../../../../../../../assets/js/components/resources/character/pages/helpers/CharacterDocumentsHelper.jsx';
import CharacterContextController
  from '../../../../../../../assets/js/components/resources/character/pages/controllers/CharacterContextController.js';
import ResourceExchangeModalHelper
  from '../../../../../../../assets/js/components/resources/character/pages/elements/helpers/ResourceExchangeModalHelper.jsx';
import { buildDocumentExchangeCharacter, resolveDocumentExchangeButton }
  from '../../../../../../../assets/js/components/resources/character/pages/shared/CharacterDocuments.jsx';
import FacadeRefresh from '../../../../../../../assets/js/utils/access/useFacadeRefresh.js';
import { stubBuildEffect } from '../../../../../../support/controllerStubs.js';

// Seeds the page's character state by invoking the `setCharacter` setter once, as soon as the
// page's `CharacterContextController` is constructed (a render-phase update), since effects
// never run under `renderToStaticMarkup`.
function seedCharacter(character) {
  const { prototype } = CharacterContextController;
  let stored;
  let seeded = false;

  Object.defineProperty(prototype, 'setCharacter', {
    configurable: true,
    set(value) {
      stored = value;

      if (!seeded) {
        seeded = true;
        value(character);
      }
    },
    get() {
      return stored;
    },
  });

  return () => delete prototype.setCharacter;
}

const KINDS = [
  {
    label: 'PcCharacterDocuments', Component: PcCharacterDocuments, kind: 'pcs', listType: 'pc-documents', characterId: '7',
  },
  {
    label: 'NpcCharacterDocuments', Component: NpcCharacterDocuments, kind: 'npcs', listType: 'npc-documents', characterId: '9',
  },
];

KINDS.forEach(({
  label, Component, kind, listType, characterId,
}) => {
  describe(label, function() {
    let originalWindow;

    beforeEach(function() {
      originalWindow = globalThis.window;
      globalThis.window = { location: { hash: `#/games/demo/${kind}/${characterId}/documents` } };
      stubBuildEffect(CharacterContextController);
    });

    afterEach(function() {
      globalThis.window = originalWindow;
    });

    it('wires FacadeRefresh.useFacadeRefresh with the character context controller', function() {
      spyOn(FacadeRefresh, 'useFacadeRefresh');

      renderToStaticMarkup(React.createElement(Component));

      expect(FacadeRefresh.useFacadeRefresh).toHaveBeenCalledWith(jasmine.any(CharacterContextController));
    });

    it('resolves the game slug/character id from the hash and delegates to CharacterDocumentsHelper', function() {
      const renderSpy = spyOn(CharacterDocumentsHelper, 'render').and.callThrough();

      renderToStaticMarkup(React.createElement(Component));

      expect(renderSpy).toHaveBeenCalledWith(kind, listType, 'demo', characterId, 0, null);
    });

    it('does not render the Exchange button before the character context loads', function() {
      const html = renderToStaticMarkup(React.createElement(Component));

      expect(html).not.toContain('Document Exchange');
    });

    describe('with a loaded character', function() {
      let restore;

      afterEach(function() {
        restore();
      });

      it('renders the Exchange button when the character can exchange documents', function() {
        restore = seedCharacter({ can_exchange_document: true, can_edit: false });
        const renderSpy = spyOn(CharacterDocumentsHelper, 'render').and.callThrough();

        const html = renderToStaticMarkup(React.createElement(Component));

        expect(renderSpy).toHaveBeenCalledWith(kind, listType, 'demo', characterId, 0, jasmine.any(Function));
        expect(html).toContain('Document Exchange');
      });

      it('does not render the Exchange button when the flag is false, even if the character is editable', function() {
        restore = seedCharacter({ can_exchange_document: false, can_edit: true, game_can_edit: true });

        const html = renderToStaticMarkup(React.createElement(Component));

        expect(html).not.toContain('Document Exchange');
      });

      it('does not render the Exchange button when the flag is missing (anonymous)', function() {
        restore = seedCharacter({ can_edit: false });

        const html = renderToStaticMarkup(React.createElement(Component));

        expect(html).not.toContain('Document Exchange');
      });
    });

    it('renders the document exchange modal configured with the acquire/remove tabs', function() {
      let capturedState;
      spyOn(ResourceExchangeModalHelper, 'render').and.callFake((show, state) => {
        capturedState = state;
        return React.createElement('div', null, 'modal');
      });

      renderToStaticMarkup(React.createElement(Component));

      expect(capturedState.activeTab).toBe('acquire');
      expect(capturedState.tabs.acquire).toBeDefined();
      expect(capturedState.tabs.remove).toBeDefined();
      expect(capturedState.tabs.buy).toBeUndefined();
    });
  });
});

describe('resolveDocumentExchangeButton', function() {
  it('is true when the character can exchange documents', function() {
    expect(resolveDocumentExchangeButton({ can_exchange_document: true, can_edit: false })).toBe(true);
  });

  it('is false when the character cannot exchange documents, even if it can be edited', function() {
    expect(resolveDocumentExchangeButton({ can_exchange_document: false, can_edit: true })).toBe(false);
  });

  it('is false when the flag is missing, even if the character can be edited', function() {
    expect(resolveDocumentExchangeButton({ can_edit: true })).toBe(false);
  });

  it('is false while the character has not loaded yet', function() {
    expect(resolveDocumentExchangeButton(null)).toBe(false);
  });
});

describe('buildDocumentExchangeCharacter', function() {
  it('threads canEdit (character-level) and gameCanEdit (game-level) independently', function() {
    const character = { can_edit: true, game_can_edit: false };

    expect(buildDocumentExchangeCharacter('7', 'demo', true, character)).toEqual({
      id: '7', game_slug: 'demo', is_pc: true, canEdit: true, gameCanEdit: false,
    });
  });

  it('threads gameCanEdit true independently of canEdit', function() {
    const character = { can_edit: false, game_can_edit: true };

    expect(buildDocumentExchangeCharacter('7', 'demo', false, character)).toEqual({
      id: '7', game_slug: 'demo', is_pc: false, canEdit: false, gameCanEdit: true,
    });
  });

  it('defaults both flags to undefined while the character has not loaded yet', function() {
    expect(buildDocumentExchangeCharacter('7', 'demo', true, null)).toEqual({
      id: '7', game_slug: 'demo', is_pc: true, canEdit: undefined, gameCanEdit: undefined,
    });
  });
});
