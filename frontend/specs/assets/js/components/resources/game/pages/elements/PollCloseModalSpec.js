import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PollCloseModal
  from '../../../../../../../../assets/js/components/resources/game/pages/elements/PollCloseModal.jsx';
import PollCloseModalHelper
  from '../../../../../../../../assets/js/components/resources/game/pages/elements/helpers/PollCloseModalHelper.jsx';
import PollCloseModalController
  from '../../../../../../../../assets/js/components/resources/game/pages/elements/controllers/PollCloseModalController.js';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';

describe('PollCloseModal', function() {
  const poll = {
    id: 7, title: 'Which tavern?', type: 'single', game_slug: 'demo', options: [{ id: 10, option: 'Griffin' }],
  };

  const renderModal = (props = {}) => {
    let captured = null;

    spyOn(PollCloseModalHelper, 'render').and.callFake((show, renderedPoll, state, handlers) => {
      captured = {
        show, poll: renderedPoll, state, handlers,
      };
      return React.createElement('div', null, 'modal');
    });

    renderToStaticMarkup(
      React.createElement(PollCloseModal, {
        show: true, poll, onCancel: jasmine.createSpy('onCancel'), onClosed: jasmine.createSpy('onClosed'), ...props,
      }),
    );

    return captured;
  };

  beforeEach(function() {
    spyOn(PollCloseModalController.prototype, 'fetchTallies').and.returnValue(new Promise(Noop.noop));
  });

  it('renders nothing when no poll is loaded yet', function() {
    const html = renderToStaticMarkup(
      React.createElement(PollCloseModal, {
        show: false, poll: null, onCancel: jasmine.createSpy('onCancel'), onClosed: jasmine.createSpy('onClosed'),
      }),
    );

    expect(html).toBe('');
  });

  it('forwards the show prop and poll as-is', function() {
    const captured = renderModal({ show: false });

    expect(captured.show).toBe(false);
    expect(captured.poll).toBe(poll);
  });

  it('seeds the default (off) override state with no selection and an idle status', function() {
    const captured = renderModal();

    expect(captured.state.override).toBe(false);
    expect(captured.state.selectedOptionId).toBeNull();
    expect(captured.state.status).toBe('idle');
  });

  it('resolves the max-vote option ids and effective winner from an empty tally by default', function() {
    const captured = renderModal();

    expect(captured.state.maxVoteOptionIds).toEqual([10]);
    expect(captured.state.effectiveWinnerId).toBe(10);
  });

  it('toggles the override state via onToggleOverride', function() {
    const captured = renderModal();

    expect(() => captured.handlers.onToggleOverride()).not.toThrow();
  });

  it('sets the selected option id via onSelectOption', function() {
    const captured = renderModal();

    expect(() => captured.handlers.onSelectOption(10)).not.toThrow();
  });

  it('submits with a null option id in the default (off) mode', function() {
    spyOn(PollCloseModalController.prototype, 'closePoll');
    const captured = renderModal();

    captured.handlers.onSubmit();

    expect(PollCloseModalController.prototype.closePoll).toHaveBeenCalledWith(
      'demo', 7, null, null, jasmine.objectContaining({ onClosed: jasmine.any(Function) })
    );
  });
});
