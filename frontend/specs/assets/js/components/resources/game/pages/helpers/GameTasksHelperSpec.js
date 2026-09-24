import { renderToStaticMarkup } from 'react-dom/server';
import GameTasksHelper from '../../../../../../../../assets/js/components/resources/game/pages/helpers/GameTasksHelper.jsx';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';
import SingleResourcePickerField
  from '../../../../../../../../assets/js/components/common/forms/SingleResourcePickerField.jsx';
import FormField from '../../../../../../../../assets/js/components/common/forms/FormField.jsx';
import { findElement } from '../../../../common/forms/helpers/support.js';

describe('GameTasksHelper', function() {
  const pagination = { page: 1, pages: 3, perPage: 10 };
  const formValues = { category: 'other', shortDescription: '', longDescription: '' };
  const handlers = {
    onToggle: Noop.noop,
    onFormChange: Noop.noop,
    onCreate: Noop.noop,
    onView: Noop.noop,
  };

  describe('.render', function() {
    it('renders each task short description', function() {
      const tasks = [
        {
          id: 1, short_description: 'Prep encounter', long_description: '', completed: false, session: null,
        },
        {
          id: 2, short_description: 'Buy snacks', long_description: '', completed: true, session: null,
        },
      ];

      const html = renderToStaticMarkup(
        GameTasksHelper.render(
          {
            tasks, pagination, basePath: '#/games/demo/tasks', backHref: '#/games/demo', formValues, fieldErrors: {},
          },
          handlers,
        ),
      );

      expect(html).toContain('Prep encounter');
      expect(html).toContain('Buy snacks');
    });

    it('renders each task translated category badge', function() {
      const tasks = [
        {
          id: 1, short_description: 'Prep encounter', long_description: '', completed: false, session: null, category: 'painting',
        },
        {
          id: 2, short_description: 'Buy snacks', long_description: '', completed: false, session: null, category: 'buying',
        },
      ];

      const html = renderToStaticMarkup(
        GameTasksHelper.render(
          {
            tasks, pagination, basePath: '#/games/demo/tasks', backHref: '#/games/demo', formValues, fieldErrors: {},
          },
          handlers,
        ),
      );

      expect(html).toContain('<span class="badge bg-secondary">Painting</span>');
      expect(html).toContain('<span class="badge bg-secondary">Buying</span>');
    });

    it('renders the other label for a missing or unknown category', function() {
      const tasks = [
        {
          id: 1, short_description: 'Prep encounter', long_description: '', completed: false, session: null,
        },
        {
          id: 2, short_description: 'Buy snacks', long_description: '', completed: false, session: null, category: 'cooking',
        },
      ];

      const html = renderToStaticMarkup(
        GameTasksHelper.render(
          {
            tasks,
            pagination,
            basePath: '#/games/demo/tasks',
            backHref: '#/games/demo',
            formValues: { ...formValues, category: 'buying' },
            fieldErrors: {},
          },
          handlers,
        ),
      );

      expect(html.match(/<span class="badge bg-secondary">Other<\/span>/g).length).toBe(2);
      expect(html).not.toContain('game_task.category');
    });

    it('marks completed tasks as checked', function() {
      const tasks = [{
        id: 1, short_description: 'Prep encounter', long_description: '', completed: true, session: null,
      }];

      const html = renderToStaticMarkup(
        GameTasksHelper.render(
          {
            tasks, pagination, basePath: '#/games/demo/tasks', backHref: '#/games/demo', formValues, fieldErrors: {},
          },
          handlers,
        ),
      );

      expect(html).toContain('checked=""');
    });

    it('renders an empty state message when there are no tasks', function() {
      const html = renderToStaticMarkup(
        GameTasksHelper.render(
          {
            tasks: [], pagination, basePath: '#/games/demo/tasks', backHref: '#/games/demo', formValues, fieldErrors: {},
          },
          handlers,
        ),
      );

      expect(html).toContain('No tasks yet.');
    });

    it('renders a back button to the parent game page', function() {
      const html = renderToStaticMarkup(
        GameTasksHelper.render(
          {
            tasks: [], pagination, basePath: '#/games/demo/tasks', backHref: '#/games/demo', formValues, fieldErrors: {},
          },
          handlers,
        ),
      );

      expect(html).toContain('href="#/games/demo"');
    });

    it('renders the inline add form fields', function() {
      const html = renderToStaticMarkup(
        GameTasksHelper.render(
          {
            tasks: [], pagination, basePath: '#/games/demo/tasks', backHref: '#/games/demo', formValues, fieldErrors: {},
          },
          handlers,
        ),
      );

      expect(html).toContain('Short description');
      expect(html).toContain('Long description');
      expect(html).toContain('Add task');
    });

    it('renders field errors from the add form', function() {
      const html = renderToStaticMarkup(
        GameTasksHelper.render(
          {
            tasks: [],
            pagination,
            basePath: '#/games/demo/tasks',
            backHref: '#/games/demo',
            formValues,
            fieldErrors: { short_description: ['is required'] },
          },
          handlers,
        ),
      );

      expect(html).toContain('is required');
    });

    describe('category picker', function() {
      const renderForm = (overrides = {}, formHandlers = handlers) => {
        const element = GameTasksHelper.render(
          {
            tasks: [],
            pagination,
            basePath: '#/games/demo/tasks',
            backHref: '#/games/demo',
            formValues,
            fieldErrors: {},
            ...overrides,
          },
          formHandlers,
        );

        return findElement(element, (node) => node.type === 'form');
      };

      it('is the first field of the add form, before the short description', function() {
        const form = renderForm();
        const [first, second] = form.props.children;

        expect(first.type).toBe(SingleResourcePickerField);
        expect(first.props.id).toBe('game-tasks-new-category');
        expect(second.type).toBe(FormField);
        expect(second.props.id).toBe('game-tasks-new-short-description');
      });

      it('lists the task categories in constant mode, with translated labels', function() {
        const picker = findElement(renderForm(), (node) => node.type === SingleResourcePickerField);

        expect(picker.props.picker.values[0]).toBe('printing');
        expect(picker.props.picker.values[9]).toBe('other');
        expect(picker.props.picker.maxEntries).toBe(10);
        expect(picker.props.picker.maxEntries).toBe(picker.props.picker.values.length);
        expect(picker.props.picker.translateOption('painting')).toBe('Painting');
        expect(picker.props.label).toBe('Category');
        expect(picker.props.searchPlaceholder).toBe('Search category...');
      });

      it('starts at the other category', function() {
        const picker = findElement(renderForm(), (node) => node.type === SingleResourcePickerField);

        expect(picker.props.value).toEqual({ id: 'other', name: 'Other' });
      });

      it('calls onFormChange with the picked category', function() {
        const onFormChange = jasmine.createSpy('onFormChange');
        const form = renderForm({}, { ...handlers, onFormChange });
        const picker = findElement(form, (node) => node.type === SingleResourcePickerField);

        picker.props.onChange({ id: 'painting', name: 'Painting' });

        expect(onFormChange).toHaveBeenCalledWith({ ...formValues, category: 'painting' });
      });

      it('passes the category field errors', function() {
        const form = renderForm({ fieldErrors: { category: ['invalid_choice'] } });
        const picker = findElement(form, (node) => node.type === SingleResourcePickerField);

        expect(picker.props.errors).toEqual(['invalid_choice']);
      });

      it('renders the category field errors', function() {
        const html = renderToStaticMarkup(
          GameTasksHelper.render(
            {
              tasks: [],
              pagination,
              basePath: '#/games/demo/tasks',
              backHref: '#/games/demo',
              formValues,
              fieldErrors: { category: ['cooking is not valid'] },
            },
            handlers,
          ),
        );

        expect(html).toContain('cooking is not valid');
      });
    });

    it('renders pagination', function() {
      const html = renderToStaticMarkup(
        GameTasksHelper.render(
          {
            tasks: [], pagination, basePath: '#/games/demo/tasks', backHref: '#/games/demo', formValues, fieldErrors: {},
          },
          handlers,
        ),
      );

      expect(html).toContain('pagination');
    });
  });

  describe('.renderLoading', function() {
    it('renders a loading message', function() {
      const html = renderToStaticMarkup(GameTasksHelper.renderLoading());
      expect(html).toContain('Loading tasks');
    });
  });

  describe('.renderError', function() {
    it('renders the error in an alert', function() {
      const html = renderToStaticMarkup(GameTasksHelper.renderError('Something went wrong'));
      expect(html).toContain('Something went wrong');
      expect(html).toContain('alert');
    });
  });
});
