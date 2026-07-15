import { renderToStaticMarkup } from 'react-dom/server';
import GamePollNewHelper
  from '../../../../../../../../assets/js/components/resources/game/pages/helpers/GamePollNewHelper.jsx';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';

describe('GamePollNewHelper', function() {
  const handlers = {
    onSubmit: Noop.noop,
    onTitleChange: Noop.noop,
    onDescriptionChange: Noop.noop,
    onTypeChange: Noop.noop,
    onOptionChange: Noop.noop,
    onOptionRemove: Noop.noop,
  };

  describe('.render', function() {
    it('renders the title, description, and type radios', function() {
      const html = renderToStaticMarkup(GamePollNewHelper.render(
        {
          title: '', description: '', type: 'single', options: [''], status: 'idle', fieldErrors: {},
        },
        handlers,
      ));

      expect(html).toContain('id="game-poll-new-title"');
      expect(html).toContain('id="game-poll-new-description"');
      expect(html).toContain('id="game-poll-new-type-single"');
      expect(html).toContain('id="game-poll-new-type-multiple"');
    });

    it('renders a trash icon for every filled option but not for the last blank one', function() {
      const html = renderToStaticMarkup(GamePollNewHelper.render(
        {
          title: '', description: '', type: 'single', options: ['Griffin', ''], status: 'idle', fieldErrors: {},
        },
        handlers,
      ));

      expect(html).toContain('data-testid="game-poll-new-option-remove-0"');
      expect(html).not.toContain('data-testid="game-poll-new-option-remove-1"');
    });

    it('renders a trash icon for every entry when none is blank', function() {
      const html = renderToStaticMarkup(GamePollNewHelper.render(
        {
          title: '', description: '', type: 'single', options: ['Griffin', 'Anchor'], status: 'idle', fieldErrors: {},
        },
        handlers,
      ));

      expect(html).toContain('data-testid="game-poll-new-option-remove-0"');
      expect(html).toContain('data-testid="game-poll-new-option-remove-1"');
    });

    it('renders field errors for the title, type, and options fields', function() {
      const html = renderToStaticMarkup(GamePollNewHelper.render(
        {
          title: '',
          description: '',
          type: 'single',
          options: [''],
          status: 'idle',
          fieldErrors: { title: ['is required'], type: ['is invalid'], options: ['need at least 2'] },
        },
        handlers,
      ));

      expect(html).toContain('is required');
      expect(html).toContain('is invalid');
      expect(html).toContain('need at least 2');
    });

    it('disables the submit button while submitting', function() {
      const html = renderToStaticMarkup(GamePollNewHelper.render(
        {
          title: '', description: '', type: 'single', options: [''], status: 'submitting', fieldErrors: {},
        },
        handlers,
      ));

      expect(html).toContain('disabled=""');
    });

    it('renders an error alert when status is error', function() {
      const html = renderToStaticMarkup(GamePollNewHelper.render(
        {
          title: '', description: '', type: 'single', options: [''], status: 'error', fieldErrors: {},
        },
        handlers,
      ));

      expect(html).toContain('alert-danger');
    });
  });
});
