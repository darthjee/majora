import { renderToStaticMarkup } from 'react-dom/server';
import DiskCacheCardHelper from '../../../../../../../../../assets/js/components/resources/staff_dashboard/pages/elements/helpers/DiskCacheCardHelper.jsx';

describe('DiskCacheCardHelper', function() {
  describe('.render', function() {
    it('renders the title and a loading indicator while loading', function() {
      const state = { size: null, loading: true, error: false };
      const html = renderToStaticMarkup(DiskCacheCardHelper.render(state));

      expect(html).toContain('Disk Cache');
      expect(html).toContain('Loading dashboard...');
    });

    it('renders the converted size once loaded successfully', function() {
      const state = { size: 943104, loading: false, error: false };
      const html = renderToStaticMarkup(DiskCacheCardHelper.render(state));

      expect(html).toContain('0.9 MB');
    });

    it('renders a load error message when the size failed to load', function() {
      const state = { size: null, loading: false, error: true };
      const html = renderToStaticMarkup(DiskCacheCardHelper.render(state));

      expect(html).toContain('Unable to load disk cache size.');
      expect(html).toContain('text-danger');
    });

    it('renders no actions', function() {
      const state = { size: 128, loading: false, error: false };
      const rendered = DiskCacheCardHelper.render(state);

      expect(rendered.props.actions).toBeNull();
    });
  });
});
