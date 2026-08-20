import { render } from './support.js';

describe('HeaderHelper', function() {
  describe('.render', function() {
    describe('navbar brand title/sub-title', function() {
      it('renders the resolved domain config title', function() {
        const html = render({ domainConfig: { favicon: null, title: 'Custom Domain', subTitle: 'RPG' } });

        expect(html).toContain('Custom Domain');
      });

      it('renders the resolved domain config sub-title', function() {
        const html = render({ domainConfig: { favicon: null, title: 'Majora', subTitle: 'Custom Sub Title' } });

        expect(html).toContain('Custom Sub Title');
      });

      it('renders an empty sub-title when the domain config sub-title is an empty string', function() {
        const html = render({ domainConfig: { favicon: null, title: 'Majora', subTitle: '' } });

        expect(html).toContain('<small class="d-block text-muted"></small>');
      });
    });
  });
});
