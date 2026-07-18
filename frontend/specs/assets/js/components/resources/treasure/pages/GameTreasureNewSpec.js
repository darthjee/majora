import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameTreasureNew from '../../../../../../../assets/js/components/resources/treasure/pages/GameTreasureNew.jsx';
import GameTreasureNewController from '../../../../../../../assets/js/components/resources/treasure/pages/controllers/GameTreasureNewController.js';
import GameTreasureNewHelper from '../../../../../../../assets/js/components/resources/treasure/pages/helpers/GameTreasureNewHelper.jsx';
import MoneyEditModalHelper from '../../../../../../../assets/js/components/common/modals/helpers/MoneyEditModalHelper.jsx';
import { stubBuildEffect } from '../../../../../../support/controllerStubs.js';

describe('GameTreasureNew', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/treasures/new' } };
    stubBuildEffect(GameTreasureNewController);
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('renders the treasure creation form', function() {
    const html = renderToStaticMarkup(React.createElement(GameTreasureNew));

    expect(html).toContain('id="game-treasure-new-name"');
  });

  it('does not render a raw numeric value input', function() {
    const html = renderToStaticMarkup(React.createElement(GameTreasureNew));

    expect(html).not.toContain('id="game-treasure-new-value"');
  });

  it('renders the submit button', function() {
    const html = renderToStaticMarkup(React.createElement(GameTreasureNew));

    expect(html).toContain('type="submit"');
  });

  it('renders the collapsed value breakdown as "0 GP" initially', function() {
    const html = renderToStaticMarkup(React.createElement(GameTreasureNew));

    expect(html).toContain('0 GP');
  });

  describe('value modal', function() {
    it('renders the value modal initially closed', function() {
      let capturedShow;
      spyOn(MoneyEditModalHelper, 'render').and.callFake((show) => {
        capturedShow = show;
        return null;
      });

      renderToStaticMarkup(React.createElement(GameTreasureNew));

      expect(capturedShow).toBe(false);
    });

    it('renders the value modal with the treasure context', function() {
      let capturedContext;
      spyOn(MoneyEditModalHelper, 'render').and.callFake((show, state, handlers, context) => {
        capturedContext = context;
        return null;
      });

      renderToStaticMarkup(React.createElement(GameTreasureNew));

      expect(capturedContext).toBe('treasure');
    });

    it('defaults the value modal gameType to dnd before the game fetch resolves', function() {
      let capturedGameType;
      spyOn(MoneyEditModalHelper, 'render').and.callFake((show, state, handlers, context, gameType) => {
        capturedGameType = gameType;
        return null;
      });

      renderToStaticMarkup(React.createElement(GameTreasureNew));

      expect(capturedGameType).toBe('dnd');
    });

    it('opens the value modal via onOpenValueModal without throwing', function() {
      let capturedHandlers;
      spyOn(GameTreasureNewHelper, 'render').and.callFake((state, handlers) => {
        capturedHandlers = handlers;
        return null;
      });
      spyOn(MoneyEditModalHelper, 'render').and.returnValue(null);

      renderToStaticMarkup(React.createElement(GameTreasureNew));

      expect(() => capturedHandlers.onOpenValueModal()).not.toThrow();
    });

    it('does not throw when the value modal is closed or confirmed', function() {
      let capturedMoneyModalHandlers;
      spyOn(MoneyEditModalHelper, 'render').and.callFake((show, state, handlers) => {
        capturedMoneyModalHandlers = handlers;
        return null;
      });

      renderToStaticMarkup(React.createElement(GameTreasureNew));

      expect(() => {
        capturedMoneyModalHandlers.onClose();
        capturedMoneyModalHandlers.onConfirm(500);
      }).not.toThrow();
    });
  });
});
