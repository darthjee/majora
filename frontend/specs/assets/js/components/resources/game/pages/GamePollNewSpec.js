import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GamePollNew from '../../../../../../../assets/js/components/resources/game/pages/GamePollNew.jsx';
import GamePollNewController from '../../../../../../../assets/js/components/resources/game/pages/controllers/GamePollNewController.js';
import GamePollNewHelper from '../../../../../../../assets/js/components/resources/game/pages/helpers/GamePollNewHelper.jsx';
import Noop from '../../../../../../../assets/js/utils/Noop.js';
import { stubBuildEffect } from '../../../../../../support/controllerStubs.js';

describe('GamePollNew', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/polls/new' } };
    stubBuildEffect(GamePollNewController);
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('renders the poll creation form', function() {
    const html = renderToStaticMarkup(React.createElement(GamePollNew));

    expect(html).toContain('id="game-poll-new-title"');
    expect(html).toContain('id="game-poll-new-description"');
    expect(html).toContain('id="game-poll-new-type-single"');
    expect(html).toContain('id="game-poll-new-type-multiple"');
  });

  it('renders a single blank option field to start with', function() {
    const html = renderToStaticMarkup(React.createElement(GamePollNew));

    expect(html).toContain('data-testid="game-poll-new-option-0"');
    expect(html).not.toContain('data-testid="game-poll-new-option-1"');
  });

  it('renders the submit button', function() {
    const html = renderToStaticMarkup(React.createElement(GamePollNew));

    expect(html).toContain('type="submit"');
  });

  it('renders the option type select, defaulted to text', function() {
    const html = renderToStaticMarkup(React.createElement(GamePollNew));

    expect(html).toContain('id="game-poll-new-option-type"');
  });

  it('includes the default option_type in the submit payload', function() {
    let capturedHandlers;
    spyOn(GamePollNewHelper, 'render').and.callFake((state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });
    const submitFormSpy = spyOn(GamePollNewController.prototype, 'submitForm');

    renderToStaticMarkup(React.createElement(GamePollNew));
    capturedHandlers.onSubmit({ preventDefault: Noop.noop });

    expect(submitFormSpy).toHaveBeenCalled();
    const formValues = submitFormSpy.calls.mostRecent().args[2];
    expect(formValues.option_type).toBe('text');
  });
});
