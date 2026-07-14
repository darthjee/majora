import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import TreasureNew from '../../../../../../../assets/js/components/resources/treasure/pages/TreasureNew.jsx';
import TreasureNewController from '../../../../../../../assets/js/components/resources/treasure/pages/controllers/TreasureNewController.js';
import TreasureNewHelper from '../../../../../../../assets/js/components/resources/treasure/pages/helpers/TreasureNewHelper.jsx';
import MoneyEditModalHelper from '../../../../../../../assets/js/components/common/helpers/MoneyEditModalHelper.jsx';
import { stubBuildEffect } from '../../../../../../support/controllerStubs.js';

describe('TreasureNew', function() {
  beforeEach(function() {
    stubBuildEffect(TreasureNewController);
  });

  it('renders the treasure creation form', function() {
    const html = renderToStaticMarkup(React.createElement(TreasureNew));

    expect(html).toContain('id="treasure-new-name"');
  });

  it('renders the submit button', function() {
    const html = renderToStaticMarkup(React.createElement(TreasureNew));

    expect(html).toContain('type="submit"');
  });

  it('renders the collapsed value breakdown as "0 GP" initially', function() {
    const html = renderToStaticMarkup(React.createElement(TreasureNew));

    expect(html).toContain('0 GP');
  });

  describe('value modal', function() {
    it('renders the value modal initially closed', function() {
      let capturedShow;
      spyOn(MoneyEditModalHelper, 'render').and.callFake((show) => {
        capturedShow = show;
        return null;
      });

      renderToStaticMarkup(React.createElement(TreasureNew));

      expect(capturedShow).toBe(false);
    });

    it('renders the value modal with the treasure context', function() {
      let capturedContext;
      spyOn(MoneyEditModalHelper, 'render').and.callFake((show, state, handlers, context) => {
        capturedContext = context;
        return null;
      });

      renderToStaticMarkup(React.createElement(TreasureNew));

      expect(capturedContext).toBe('treasure');
    });

    it('opens the value modal via onOpenValueModal without throwing', function() {
      let capturedHandlers;
      spyOn(TreasureNewHelper, 'render').and.callFake((state, handlers) => {
        capturedHandlers = handlers;
        return null;
      });
      spyOn(MoneyEditModalHelper, 'render').and.returnValue(null);

      renderToStaticMarkup(React.createElement(TreasureNew));

      expect(() => capturedHandlers.onOpenValueModal()).not.toThrow();
    });

    it('does not throw when the value modal is closed or confirmed', function() {
      let capturedMoneyModalHandlers;
      spyOn(MoneyEditModalHelper, 'render').and.callFake((show, state, handlers) => {
        capturedMoneyModalHandlers = handlers;
        return null;
      });

      renderToStaticMarkup(React.createElement(TreasureNew));

      expect(() => {
        capturedMoneyModalHandlers.onClose();
        capturedMoneyModalHandlers.onConfirm(500);
      }).not.toThrow();
    });
  });
});
