import GameSessionsController
  from '../../../../../../../../../assets/js/components/resources/game_session/pages/controllers/GameSessionsController.js';
import { buildDefaultSessionColumns } from
  '../../../../../../../../../assets/js/components/resources/game_session/pages/sessionColumns.js';
import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';
import { buildClient, applyColumnUpdates } from './support.js';

describe('GameSessionsController', function() {
  it('fetches past/future/unscheduled sessions using per-column hash query params', async function() {
    const setColumns = jasmine.createSpy('setColumns');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const setCanEdit = jasmine.createSpy('setCanEdit');

    const client = buildClient(
      '#/games/demo/sessions?past_page=2&past_per_page=5&future_page=3&unscheduled_per_page=20',
      (path) => {
        if (path === '/games/demo/sessions/past.json') {
          return Promise.resolve({
            data: [{ id: 1, title: 'Past Session', date: '2020-01-01', game_slug: 'demo' }],
            pagination: { page: 2, pages: 4, perPage: 5 },
          });
        }

        if (path === '/games/demo/sessions/future.json') {
          return Promise.resolve({
            data: [{ id: 2, title: 'Future Session', date: '2099-01-01', game_slug: 'demo' }],
            pagination: { page: 3, pages: 3, perPage: 10 },
          });
        }

        return Promise.resolve({
          data: [{ id: 3, title: 'Unscheduled Session', date: null, game_slug: 'demo' }],
          pagination: { page: 1, pages: 1, perPage: 20 },
        });
      },
    );
    spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: false }));

    const cleanup = new GameSessionsController(
      setColumns, setLoading, setError, client, setCanEdit,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(client.fetchIndex).toHaveBeenCalledWith(
      '/games/demo/sessions/past.json', { page: '2', per_page: '5' },
    );
    expect(client.fetchIndex).toHaveBeenCalledWith(
      '/games/demo/sessions/future.json', { page: '3', per_page: null },
    );
    expect(client.fetchIndex).toHaveBeenCalledWith(
      '/games/demo/sessions/unscheduled.json', { page: null, per_page: '20' },
    );

    const columns = applyColumnUpdates(setColumns, buildDefaultSessionColumns());

    expect(columns.past.sessions).toEqual(
      [{ id: 1, title: 'Past Session', date: '2020-01-01', game_slug: 'demo' }],
    );
    expect(columns.past.pagination).toEqual({ page: 2, pages: 4, perPage: 5 });
    expect(columns.future.sessions[0].title).toBe('Future Session');
    expect(columns.unscheduled.sessions[0].title).toBe('Unscheduled Session');
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });
});
