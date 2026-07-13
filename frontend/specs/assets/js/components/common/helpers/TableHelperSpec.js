import { renderToStaticMarkup } from 'react-dom/server';
import TableHelper from '../../../../../../assets/js/components/common/helpers/TableHelper.jsx';

describe('TableHelper', function() {
  const columns = [{ key: 'name', label: 'Name' }];

  describe('.render', function() {
    it('renders a header cell per column', function() {
      const html = renderToStaticMarkup(TableHelper.render(columns, []));

      expect(html).toContain('<th>Name</th>');
    });

    it('renders an empty trailing header cell when renderActions is provided', function() {
      const html = renderToStaticMarkup(TableHelper.render(columns, [], () => 'x'));

      expect(html).toContain('<th></th>');
    });

    it('falls back to the row index as key when rows have no id', function() {
      const rows = [{ name: 'A' }, { name: 'B' }];

      expect(() => renderToStaticMarkup(TableHelper.render(columns, rows))).not.toThrow();
    });

    it('renders a data cell per row per column', function() {
      const rows = [{ id: 1, name: 'Jane' }];
      const html = renderToStaticMarkup(TableHelper.render(columns, rows));

      expect(html).toContain('<td>Jane</td>');
    });

    it('does not render an actions cell when renderActions is absent', function() {
      const rows = [{ id: 1, name: 'Jane' }];
      const html = renderToStaticMarkup(TableHelper.render(columns, rows));

      expect(html).not.toContain('<td></td>');
    });
  });
});
