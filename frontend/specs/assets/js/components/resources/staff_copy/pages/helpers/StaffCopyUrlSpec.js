import StaffCopyUrl from '../../../../../../../../assets/js/components/resources/staff_copy/pages/helpers/StaffCopyUrl.js';
import HashRouteResolver from '../../../../../../../../assets/js/utils/routing/HashRouteResolver.js';

describe('StaffCopyUrl', function() {
  describe('.read', function() {
    it('reads type, from and to from the hash query', function() {
      const resolver = new HashRouteResolver(() => '#/staff/copies?type=items&from=a&to=b&page=2');

      expect(StaffCopyUrl.read(resolver)).toEqual({ type: 'items', from: 'a', to: 'b' });
    });

    it('defaults missing keys to empty strings', function() {
      const resolver = new HashRouteResolver(() => '#/staff/copies');

      expect(StaffCopyUrl.read(resolver)).toEqual({ type: '', from: '', to: '' });
    });
  });

  describe('.build', function() {
    it('builds the page path with every set selector', function() {
      expect(StaffCopyUrl.build({ type: 'items', from: 'a', to: 'b' })).toBe('/staff/copies?type=items&from=a&to=b');
    });

    it('omits empty selectors', function() {
      expect(StaffCopyUrl.build({ type: '', from: 'a', to: '' })).toBe('/staff/copies?from=a');
    });

    it('returns the bare path when nothing is selected', function() {
      expect(StaffCopyUrl.build({})).toBe('/staff/copies');
    });
  });
});
