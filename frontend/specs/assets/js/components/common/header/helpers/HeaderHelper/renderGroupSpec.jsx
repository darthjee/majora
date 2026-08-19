import { renderToStaticMarkup } from 'react-dom/server';
import HeaderNavHelper from '../../../../../../../../assets/js/components/common/header/helpers/HeaderNavHelper.jsx';

describe('HeaderNavHelper', function() {
  describe('.renderGroup', function() {
    const entries = [
      { id: 'demo-a', group: 'demo', rules: { all: ['flagA'] }, render: () => <span data-testid="demo-a">A</span> },
      { id: 'demo-b', group: 'demo', rules: { all: ['flagB'] }, render: () => <span data-testid="demo-b">B</span> },
      { id: 'other', group: 'other', rules: { all: ['flagA'] }, render: () => <span data-testid="other">O</span> },
    ];

    it('renders null when no entry in the group survives the rules', function() {
      const result = HeaderNavHelper.renderGroup('demo', 'Demo', 'demo-dropdown', entries, { flagA: false, flagB: false });

      expect(result).toBeNull();
    });

    it('renders a NavDropdown with only the surviving entries of the requested group', function() {
      const result = HeaderNavHelper.renderGroup('demo', 'Demo', 'demo-dropdown', entries, { flagA: true, flagB: false });
      const html = renderToStaticMarkup(result);

      expect(html).toContain('data-testid="demo-a"');
      expect(html).not.toContain('data-testid="demo-b"');
      expect(html).not.toContain('data-testid="other"');
      expect(html).toContain('id="demo-dropdown"');
      expect(html).toContain('Demo');
    });

    it('renders every surviving entry when more than one matches', function() {
      const result = HeaderNavHelper.renderGroup('demo', 'Demo', 'demo-dropdown', entries, { flagA: true, flagB: true });
      const html = renderToStaticMarkup(result);

      expect(html).toContain('data-testid="demo-a"');
      expect(html).toContain('data-testid="demo-b"');
    });

    it('ignores entries belonging to other groups even when their rules match', function() {
      const result = HeaderNavHelper.renderGroup('demo', 'Demo', 'demo-dropdown', entries, { flagA: true, flagB: true });
      const html = renderToStaticMarkup(result);

      expect(html).not.toContain('data-testid="other"');
    });
  });
});
