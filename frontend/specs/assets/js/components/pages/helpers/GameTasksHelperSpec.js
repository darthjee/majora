import { renderToStaticMarkup } from 'react-dom/server';
import GameTasksHelper from '../../../../../../assets/js/components/pages/helpers/GameTasksHelper.jsx';
import Noop from '../../../../../../assets/js/utils/Noop.js';

describe('GameTasksHelper', function() {
  const pagination = { page: 1, pages: 3, perPage: 10 };
  const formValues = { shortDescription: '', longDescription: '' };
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
