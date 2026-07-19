import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import PollTypeRadioGroup from '../../../../../../assets/js/components/common/forms/PollTypeRadioGroup.jsx';
import Translator from '../../../../../../assets/js/i18n/Translator.js';
import Noop from '../../../../../../assets/js/utils/Noop.js';

describe('PollTypeRadioGroup', function() {
  const baseProps = {
    idPrefix: 'game-poll-new-type',
    name: 'game-poll-new-type',
    translationPrefix: 'game_poll_new_page.type',
    onChange: Noop.noop,
  };

  it('renders a radio input for each poll type', function() {
    const html = renderToStaticMarkup(
      React.createElement(PollTypeRadioGroup, { ...baseProps, value: 'single' }),
    );

    expect(html).toContain('id="game-poll-new-type-single"');
    expect(html).toContain('id="game-poll-new-type-multiple"');
    expect(html).toContain('name="game-poll-new-type"');
  });

  it('marks the current value as checked', function() {
    const html = renderToStaticMarkup(
      React.createElement(PollTypeRadioGroup, { ...baseProps, value: 'multiple' }),
    );

    const multipleIndex = html.indexOf('id="game-poll-new-type-multiple"');
    const singleIndex = html.indexOf('id="game-poll-new-type-single"');

    expect(html.slice(multipleIndex, multipleIndex + 120)).toContain('checked');
    expect(html.slice(singleIndex, singleIndex + 120)).not.toContain('checked');
  });

  it('uses the given translation prefix for each label', function() {
    spyOn(Translator, 't').and.callThrough();

    renderToStaticMarkup(
      React.createElement(PollTypeRadioGroup, {
        ...baseProps, translationPrefix: 'session_poll_modal.type', value: 'single',
      }),
    );

    expect(Translator.t).toHaveBeenCalledWith('session_poll_modal.type_single');
    expect(Translator.t).toHaveBeenCalledWith('session_poll_modal.type_multiple');
  });
});
