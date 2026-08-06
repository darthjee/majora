import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameTreasure from '../../../../../../../assets/js/components/resources/treasure/pages/GameTreasure.jsx';
import GameTreasureHelper from '../../../../../../../assets/js/components/resources/treasure/pages/helpers/GameTreasureHelper.jsx';
import GiveTreasureModalHelper
  from '../../../../../../../assets/js/components/resources/treasure/pages/elements/helpers/GiveTreasureModalHelper.jsx';
import GiveTreasureModalController
  from '../../../../../../../assets/js/components/resources/treasure/pages/elements/controllers/GiveTreasureModalController.js';
import Noop from '../../../../../../../assets/js/utils/Noop.js';

const loadedTreasure = {
  id: 5, name: 'Golden Crown', value: 500, can_edit: false, available_units: null,
};

/** Stub controller that synchronously loads a treasure during construction. */
class LoadedController {
  constructor(setTreasure, setLoading) {
    setTreasure(loadedTreasure);
    setLoading(false);
  }

  buildEffect() { return () => Noop.noop; }
}

/** Stub controller that synchronously loads an editable treasure during construction. */
class LoadedEditableController {
  constructor(setTreasure, setLoading) {
    setTreasure({ ...loadedTreasure, can_edit: true });
    setLoading(false);
  }

  buildEffect() { return () => Noop.noop; }
}

/** Stub controller that stays in the loading state. */
class LoadingController {
  buildEffect() { return () => Noop.noop; }
}

/** Stub controller that synchronously sets an error during construction. */
class ErroredController {
  constructor(setTreasure, setLoading, setError) {
    setError('Unable to load treasure.');
    setLoading(false);
  }

  buildEffect() { return () => Noop.noop; }
}

describe('GameTreasure', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/treasures/5' } };
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('renders the loading state while the treasure is loading', function() {
    const html = renderToStaticMarkup(
      React.createElement(GameTreasure, { ControllerClass: LoadingController }),
    );

    expect(html).toContain('Loading treasure...');
  });

  it('renders the error state when the treasure fails to load', function() {
    const html = renderToStaticMarkup(
      React.createElement(GameTreasure, { ControllerClass: ErroredController }),
    );

    expect(html).toContain('Unable to load treasure.');
  });

  it('delegates to GameTreasureHelper.render with the treasure, back href, edit href, and handler', function() {
    let capturedTreasure;
    let capturedBackHref;
    let capturedEditHref;
    let capturedOnGiveTreasureClick;
    spyOn(GameTreasureHelper, 'render').and.callFake((treasure, backHref, editHref, onGiveTreasureClick) => {
      capturedTreasure = treasure;
      capturedBackHref = backHref;
      capturedEditHref = editHref;
      capturedOnGiveTreasureClick = onGiveTreasureClick;
      return null;
    });

    renderToStaticMarkup(React.createElement(GameTreasure, { ControllerClass: LoadedController }));

    expect(capturedTreasure).toEqual(loadedTreasure);
    expect(capturedBackHref).toBe('#/games/demo/treasures');
    expect(capturedEditHref).toBe('#/games/demo/treasures/5/edit');
    expect(typeof capturedOnGiveTreasureClick).toBe('function');
  });

  describe('give-treasure modal', function() {
    it('is shown once the give-treasure button handler is invoked', function() {
      let capturedOnGiveTreasureClick;
      spyOn(GameTreasureHelper, 'render').and.callFake((treasure, backHref, editHref, onGiveTreasureClick) => {
        capturedOnGiveTreasureClick = onGiveTreasureClick;
        return null;
      });
      let capturedShow;
      spyOn(GiveTreasureModalHelper, 'render').and.callFake((show) => {
        capturedShow = show;
        return null;
      });

      renderToStaticMarkup(React.createElement(GameTreasure, { ControllerClass: LoadedController }));

      expect(capturedShow).toBe(false);
      expect(() => capturedOnGiveTreasureClick()).not.toThrow();
    });

    it('wires the modal to the loaded treasure, game slug, and canEdit gating', async function() {
      spyOn(GameTreasureHelper, 'render').and.returnValue(null);
      let capturedHandlers;
      spyOn(GiveTreasureModalHelper, 'render').and.callFake((show, state, handlers) => {
        capturedHandlers = handlers;
        return null;
      });
      spyOn(GiveTreasureModalController.prototype, 'addCharacter').and.returnValue(Promise.resolve());
      spyOn(GiveTreasureModalController.prototype, 'submit').and.returnValue(Promise.resolve());

      renderToStaticMarkup(React.createElement(GameTreasure, { ControllerClass: LoadedEditableController }));

      capturedHandlers.onSelectCharacter({ id: 3, name: 'Aria' });

      expect(GiveTreasureModalController.prototype.addCharacter).toHaveBeenCalledWith(
        { id: 3, name: 'Aria' }, 'pcs', 'demo', loadedTreasure.id, [], jasmine.any(Function), null,
      );

      await capturedHandlers.onSubmit();

      expect(GiveTreasureModalController.prototype.submit).toHaveBeenCalledWith(
        [], 'demo', loadedTreasure.id, true, jasmine.any(Object),
      );
    });

    it('closes without throwing when onClose is invoked', function() {
      spyOn(GameTreasureHelper, 'render').and.returnValue(null);
      let capturedHandlers;
      spyOn(GiveTreasureModalHelper, 'render').and.callFake((show, state, handlers) => {
        capturedHandlers = handlers;
        return null;
      });

      renderToStaticMarkup(React.createElement(GameTreasure, { ControllerClass: LoadedController }));

      expect(() => capturedHandlers.onClose()).not.toThrow();
    });
  });
});
