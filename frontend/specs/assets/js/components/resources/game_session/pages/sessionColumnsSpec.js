import { SESSION_COLUMNS, DEFAULT_SESSION_PAGINATION, buildDefaultSessionColumns } from
  '../../../../../../../assets/js/components/resources/game_session/pages/sessionColumns.js';

describe('sessionColumns', function() {
  describe('SESSION_COLUMNS', function() {
    it('defines the past/future/unscheduled columns with distinct page params', function() {
      expect(SESSION_COLUMNS.map((column) => column.key)).toEqual(['past', 'future', 'unscheduled']);
      expect(SESSION_COLUMNS.map((column) => column.pageParam)).toEqual(
        ['past_page', 'future_page', 'unscheduled_page'],
      );
      expect(SESSION_COLUMNS.map((column) => column.perPageParam)).toEqual(
        ['past_per_page', 'future_per_page', 'unscheduled_per_page'],
      );
    });
  });

  describe('buildDefaultSessionColumns', function() {
    it('builds an empty sessions list and default pagination for each column', function() {
      const columns = buildDefaultSessionColumns();

      expect(Object.keys(columns)).toEqual(['past', 'future', 'unscheduled']);
      expect(columns.past).toEqual({ sessions: [], pagination: DEFAULT_SESSION_PAGINATION });
      expect(columns.future).toEqual({ sessions: [], pagination: DEFAULT_SESSION_PAGINATION });
      expect(columns.unscheduled).toEqual({ sessions: [], pagination: DEFAULT_SESSION_PAGINATION });
    });
  });
});
