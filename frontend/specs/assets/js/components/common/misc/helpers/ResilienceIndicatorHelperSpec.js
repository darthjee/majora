import { renderToStaticMarkup } from 'react-dom/server';
import ResilienceIndicatorHelper from '../../../../../../../assets/js/components/common/misc/helpers/ResilienceIndicatorHelper.jsx';

describe('ResilienceIndicatorHelper', function() {
  describe('.render', function() {
    it('renders the idle icon in green with the idle alt text', function() {
      const html = renderToStaticMarkup(ResilienceIndicatorHelper.render({ status: 'idle' }));

      expect(html).toContain('data-testid="resilience-indicator"');
      expect(html).toContain('bi-lightning-charge');
      expect(html).not.toContain('bi-lightning-charge-fill');
      expect(html).toContain('text-success');
      expect(html).toContain('title="Idle"');
    });

    it('renders the requesting icon in yellow with the requesting alt text', function() {
      const html = renderToStaticMarkup(ResilienceIndicatorHelper.render({ status: 'requesting' }));

      expect(html).toContain('bi-lightning-charge-fill');
      expect(html).toContain('text-warning');
      expect(html).toContain('title="Requesting"');
    });

    it('renders the retrying icon in red with the retrying alt text', function() {
      const html = renderToStaticMarkup(ResilienceIndicatorHelper.render({ status: 'retrying' }));

      expect(html).toContain('bi-hourglass-split');
      expect(html).toContain('text-danger');
      expect(html).toContain('title="Retrying"');
    });

    it('falls back to the idle icon for an unknown status', function() {
      const html = renderToStaticMarkup(ResilienceIndicatorHelper.render({ status: 'unknown' }));

      expect(html).toContain('bi-lightning-charge');
      expect(html).toContain('text-success');
    });
  });
});
