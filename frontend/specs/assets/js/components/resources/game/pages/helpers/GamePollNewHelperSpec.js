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
    onOptionTypeChange: Noop.noop,
    onOptionChange: Noop.noop,
    onOptionRemove: Noop.noop,
  };

  describe('.render', function() {
    it('renders the title, description, and type radios', function() {
      const html = renderToStaticMarkup(GamePollNewHelper.render(
        {
          title: '', description: '', type: 'single', optionType: 'text', options: [''], status: 'idle', fieldErrors: {},
        },
        handlers,
      ));

      expect(html).toContain('id="game-poll-new-title"');
      expect(html).toContain('id="game-poll-new-description"');
      expect(html).toContain('id="game-poll-new-type-single"');
      expect(html).toContain('id="game-poll-new-type-multiple"');
    });

    it('renders an option type select with text and date options', function() {
      const html = renderToStaticMarkup(GamePollNewHelper.render(
        {
          title: '', description: '', type: 'single', optionType: 'text', options: [''], status: 'idle', fieldErrors: {},
        },
        handlers,
      ));

      expect(html).toContain('id="game-poll-new-option-type"');
      expect(html).toContain('value="text"');
      expect(html).toContain('value="date"');
      expect(html).toContain('Text');
      expect(html).toContain('Date');
    });

    it('defaults the option type select to the given optionType', function() {
      const html = renderToStaticMarkup(GamePollNewHelper.render(
        {
          title: '', description: '', type: 'single', optionType: 'date', options: [''], status: 'idle', fieldErrors: {},
        },
        handlers,
      ));

      const selectStart = html.indexOf('id="game-poll-new-option-type"');

      expect(selectStart).toBeGreaterThan(-1);
      expect(html.indexOf('selected=""', selectStart)).toBeGreaterThan(-1);
    });

    it('renders the option type select after the description and before the type radios', function() {
      const html = renderToStaticMarkup(GamePollNewHelper.render(
        {
          title: '', description: '', type: 'single', optionType: 'text', options: [''], status: 'idle', fieldErrors: {},
        },
        handlers,
      ));

      const descriptionIndex = html.indexOf('id="game-poll-new-description"');
      const optionTypeIndex = html.indexOf('id="game-poll-new-option-type"');
      const typeIndex = html.indexOf('id="game-poll-new-type-single"');

      expect(descriptionIndex).toBeLessThan(optionTypeIndex);
      expect(optionTypeIndex).toBeLessThan(typeIndex);
    });

    it('renders a date input for options when optionType is date', function() {
      const html = renderToStaticMarkup(GamePollNewHelper.render(
        {
          title: '', description: '', type: 'single', optionType: 'date', options: [''], status: 'idle', fieldErrors: {},
        },
        handlers,
      ));

      expect(html).toContain('data-testid="game-poll-new-option-0"');
      expect(html).toContain('type="date"');
    });

    it('renders a trash icon for every filled option but not for the last blank one', function() {
      const html = renderToStaticMarkup(GamePollNewHelper.render(
        {
          title: '',
          description: '',
          type: 'single',
          optionType: 'text',
          options: ['Griffin', ''],
          status: 'idle',
          fieldErrors: {},
        },
        handlers,
      ));

      expect(html).toContain('data-testid="game-poll-new-option-remove-0"');
      expect(html).not.toContain('data-testid="game-poll-new-option-remove-1"');
    });

    it('renders a trash icon for every entry when none is blank', function() {
      const html = renderToStaticMarkup(GamePollNewHelper.render(
        {
          title: '',
          description: '',
          type: 'single',
          optionType: 'text',
          options: ['Griffin', 'Anchor'],
          status: 'idle',
          fieldErrors: {},
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
          optionType: 'text',
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
          title: '', description: '', type: 'single', optionType: 'text', options: [''], status: 'submitting', fieldErrors: {},
        },
        handlers,
      ));

      expect(html).toContain('disabled=""');
    });

    it('renders an error alert when status is error', function() {
      const html = renderToStaticMarkup(GamePollNewHelper.render(
        {
          title: '', description: '', type: 'single', optionType: 'text', options: [''], status: 'error', fieldErrors: {},
        },
        handlers,
      ));

      expect(html).toContain('alert-danger');
    });
  });
});
